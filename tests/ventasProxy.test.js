const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { test } = require('node:test');

process.env.SALES_SERVICE_URL = 'http://sales.test';
const ventasProxy = require('../middlewares/ventasProxy');

test('ventas proxy forwards JSON and preserves PDF responses', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/ventas', ventasProxy);

  const server = app.listen(0);
  await once(server, 'listening');

  const upstreamFetch = global.fetch;
  let forwardedRequest;
  const pdfBytes = Buffer.from([37, 80, 68, 70, 45, 49, 46, 55, 10, 0, 114, 101, 112, 111, 114, 116]);

  global.fetch = async (url, options) => {
    if (url.includes('/reporte?')) {
      return new Response(pdfBytes, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': 'attachment; filename=report.pdf'
        }
      });
    }

    forwardedRequest = { url, options };
    return new Response(JSON.stringify({ venta_id: '123' }), {
      status: 201,
      headers: { 'content-type': 'application/json' }
    });
  };

  try {
    const baseUrl = `http://127.0.0.1:${server.address().port}`;
    const postResponse = await upstreamFetch(`${baseUrl}/api/v1/ventas?origen=prueba`, {
      method: 'POST',
      headers: {
        authorization: 'Bearer token-test',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ tipo_burrito: 'Sabanero', cantidad: 2 })
    });

    assert.equal(postResponse.status, 201);
    assert.deepEqual(await postResponse.json(), { venta_id: '123' });
    assert.equal(forwardedRequest.url, 'http://sales.test/api/v1/ventas/?origen=prueba');
    assert.equal(forwardedRequest.options.headers.Authorization, 'Bearer token-test');
    assert.deepEqual(JSON.parse(forwardedRequest.options.body), { tipo_burrito: 'Sabanero', cantidad: 2 });

    const pdfResponse = await upstreamFetch(`${baseUrl}/api/v1/ventas/reporte?mes=2026-09`);
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
    assert.match(pdfResponse.headers.get('content-disposition'), /report\.pdf/);
    assert.deepEqual(Buffer.from(await pdfResponse.arrayBuffer()), pdfBytes);
  } finally {
    global.fetch = upstreamFetch;
    server.close();
    await once(server, 'close');
  }
});