const { buildSchema, graphql, GraphQLError } = require('graphql');

const schema = buildSchema(`
  type Query {
    dashboard: Dashboard!
  }

  type Dashboard {
    inventario: InventarioDashboard!
    ventasHoy: VentasDashboard
  }

  type InventarioDashboard {
    totalInsumos: Int!
    totalAlertas: Int!
    alertas: [AlertaStock!]!
  }

  type AlertaStock {
    _id: ID!
    nombre: String!
    cantidad_actual: Float!
    stock_minimo: Float!
    unidad_medida: String!
  }

  type VentasDashboard {
    totalVentas: Float!
    burritosVendidos: Int!
    recientes: [VentaReciente!]!
  }

  type VentaReciente {
    _id: ID!
    tipo_burrito: String!
    cantidad: Int!
    total: Float!
  }
`);

const inventoryUrl = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001';
const salesUrl = process.env.SALES_SERVICE_URL || 'http://localhost:4004';

async function consultarServicio(url, token, servicio) {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) throw new Error();
    return await response.json();
  } catch {
    throw new GraphQLError(`No se pudo consultar el servicio de ${servicio}.`, {
      extensions: { code: 'UPSTREAM_ERROR' }
    });
  }
}

module.exports = async (req, res, next) => {
  const { query, variables, operationName } = req.body || {};
  if (typeof query !== 'string' || !query.trim() || query.length > 4096 ||
      (variables != null && (typeof variables !== 'object' || Array.isArray(variables))) ||
      (operationName != null && typeof operationName !== 'string')) {
    return res.status(400).json({ errors: [{ message: 'Solicitud GraphQL inválida.' }] });
  }

  const { usuario, token } = req.session;
  let inventario;
  let ventas;

  // Los campos se resuelven solo si fueron pedidos; los alias comparten la consulta REST.
  const dashboard = {
    inventario: () => inventario ??= (async () => {
      const data = await consultarServicio(`${inventoryUrl}/api/v1/insumos`, token, 'inventario');
      const alertas = data.insumos.filter((insumo) => insumo.alerta_stock);
      return { totalInsumos: data.total, totalAlertas: alertas.length, alertas };
    })(),
    ventasHoy: () => {
      if (usuario.rol !== 'administrador') return null;
      return ventas ??= (async () => {
        const hoy = new Date().toISOString().slice(0, 10);
        const params = new URLSearchParams({ desde: hoy, hasta: hoy, limit: '8' });
        const data = await consultarServicio(`${salesUrl}/api/v1/ventas?${params}`, token, 'ventas');
        return {
          totalVentas: data.estadisticas.total_ventas,
          burritosVendidos: data.estadisticas.total_burritos,
          recientes: data.ventas
        };
      })();
    }
  };

  try {
    const result = await graphql({
      schema,
      source: query,
      rootValue: { dashboard },
      variableValues: variables,
      operationName
    });
    return res.status(result.data === undefined ? 400 : 200).json(result);
  } catch (err) {
    return next(err);
  }
};
