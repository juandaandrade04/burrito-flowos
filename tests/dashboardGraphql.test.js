const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { test } = require('node:test');

async function iniciar(t, app) {
  const server = app.listen(0, '127.0.0.1');
  t.after(() => new Promise((resolve, reject) => {
    server.close((err) => err ? reject(err) : resolve());
  }));
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

test('dashboard GraphQL: sesión, permisos y selección de campos en el gateway', async (t) => {
  const servicios = express();
  servicios.use(express.json());
  const llamadas = [];
  let inventarioDisponible = true;

  servicios.post('/api/v1/auth/login', (req, res) => {
    const rol = req.body.rol;
    res.json({ usuario: { id: 'usuario-test', rol }, token: `token-${rol}` });
  });
  servicios.get('/api/v1/insumos', (req, res) => {
    llamadas.push({ servicio: 'inventario', auth: req.get('authorization') });
    if (!inventarioDisponible) return res.sendStatus(503);
    res.json({
      total: 2,
      insumos: [
        { nombre: 'Tortillas', alerta_stock: true, cantidad_actual: 1 },
        { nombre: 'Fríjoles', alerta_stock: false }
      ]
    });
  });
  servicios.get('/api/v1/ventas', (req, res) => {
    llamadas.push({ servicio: 'ventas', auth: req.get('authorization'), query: req.query });
    res.json({
      estadisticas: { total_ventas: 42000, total_burritos: 3 },
      ventas: [{ _id: 'venta-1', tipo_burrito: 'Veggie', cantidad: 2, total: 28000 }]
    });
  });

  const upstream = await iniciar(t, servicios);
  process.env.AUTH_SERVICE_URL = upstream;
  process.env.INVENTORY_SERVICE_URL = upstream;
  process.env.SALES_SERVICE_URL = upstream;
  const gateway = await iniciar(t, require('../server'));

  async function iniciarSesion(rol) {
    const response = await fetch(`${gateway}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rol })
    });
    assert.equal(response.status, 200);
    return response.headers.get('set-cookie').split(';')[0];
  }

  const query = `{
    dashboard {
      inventario { totalInsumos totalAlertas alertas { nombre } }
      ventasHoy { totalVentas burritosVendidos recientes { tipo_burrito } }
    }
  }`;
  const inventario = { totalInsumos: 2, totalAlertas: 1, alertas: [{ nombre: 'Tortillas' }] };
  const consultar = (query, cookie) => fetch(`${gateway}/api/graphql`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(cookie && { cookie }) },
    body: JSON.stringify({ query })
  });

  await t.test('sin sesión responde 401 sin llamar a los servicios', async () => {
    const response = await consultar(query);
    assert.equal(response.status, 401);
    assert.deepEqual(llamadas, []);
  });

  const admin = await iniciarSesion('administrador');
  const cajero = await iniciarSesion('cajero');

  await t.test('administrador obtiene inventario y ventas con una consulta', async () => {
    const antes = new Date().toISOString().slice(0, 10);
    const response = await consultar(query, admin);
    const despues = new Date().toISOString().slice(0, 10);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { dashboard: {
      inventario,
      ventasHoy: { totalVentas: 42000, burritosVendidos: 3, recientes: [{ tipo_burrito: 'Veggie' }] }
    } } });
    assert.equal(llamadas.length, 2);
    const ventas = llamadas.find((llamada) => llamada.servicio === 'ventas');
    assert.ok([antes, despues].includes(ventas.query.desde));
    assert.equal(ventas.query.hasta, ventas.query.desde);
    assert.equal(ventas.query.limit, '8');
    assert.ok(llamadas.every((llamada) => llamada.auth === 'Bearer token-administrador'));
  });

  await t.test('cajero conserva inventario pero no consulta ventas', async () => {
    llamadas.length = 0;
    const response = await consultar(query, cajero);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: { dashboard: { inventario, ventasHoy: null } } });
    assert.deepEqual(llamadas, [{ servicio: 'inventario', auth: 'Bearer token-cajero' }]);
  });

  await t.test('solo se consultan servicios de campos seleccionados, incluso con alias', async () => {
    llamadas.length = 0;
    const response = await consultar(`{
      dashboard { inventario { totalInsumos } otro: inventario { totalAlertas } }
    }`, admin);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { data: {
      dashboard: { inventario: { totalInsumos: 2 }, otro: { totalAlertas: 1 } }
    } });
    assert.deepEqual(llamadas, [{ servicio: 'inventario', auth: 'Bearer token-administrador' }]);
  });

  await t.test('campo inválido se rechaza antes de llamar a los servicios', async () => {
    llamadas.length = 0;
    const response = await consultar('{ dashboard { desconocido } }', admin);
    assert.equal(response.status, 400);
    const result = await response.json();
    assert.match(result.errors[0].message, /desconocido/);
    assert.deepEqual(llamadas, []);
  });

  await t.test('una caída del servicio devuelve un error GraphQL', async () => {
    inventarioDisponible = false;
    const response = await consultar('{ dashboard { inventario { totalInsumos } } }', admin);
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.data, null);
    assert.equal(result.errors[0].extensions.code, 'UPSTREAM_ERROR');
  });
});
