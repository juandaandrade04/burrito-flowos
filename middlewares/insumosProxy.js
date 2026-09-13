// middlewares/insumosProxy.js
// Deriva /api/v1/insumos/* hacia el inventory-service independiente.
const express = require('express');
const router  = express.Router();

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL || 'http://localhost:4001';

router.use(async (req, res) => {
  try {
    const target  = `${INVENTORY_SERVICE_URL}/api/v1/insumos${req.url}`;
    const headers = { 'Content-Type': 'application/json' };

    if (req.headers['authorization']) {
      headers['Authorization'] = req.headers['authorization'];
    }

    const esBody  = !['GET', 'HEAD'].includes(req.method);
    const options = { method: req.method, headers };
    if (esBody) options.body = JSON.stringify(req.body || {});

    const response = await fetch(target, options);
    let data;
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({
      error: {
        codigo:    502,
        mensaje:   'Servicio de inventario no disponible. Verifique que inventory-service esté corriendo.',
        timestamp: new Date().toISOString()
      }
    });
  }
});

module.exports = router;