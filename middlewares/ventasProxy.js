// Deriva /api/v1/ventas/* al sales-service y conserva respuestas PDF.
const express = require('express');
const router = express.Router();

const SALES_SERVICE_URL = process.env.SALES_SERVICE_URL || 'http://localhost:4004';

router.use(async (req, res) => {
  try {
    const target = `${SALES_SERVICE_URL}/api/v1/ventas${req.url}`;
    const headers = {};

    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const options = { method: req.method, headers };
    if (!['GET', 'HEAD'].includes(req.method)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(req.body || {});
    }

    const response = await fetch(target, options);
    const body = Buffer.from(await response.arrayBuffer());

    for (const header of ['content-type', 'content-disposition', 'cache-control']) {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    res.status(response.status).send(body);
  } catch (err) {
    res.status(502).json({
      error: {
        codigo: 502,
        mensaje: 'Servicio de ventas no disponible. Verifique que sales-service esté corriendo.',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;