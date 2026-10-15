// middlewares/injectSessionToken.js
// Toma el JWT guardado en la sesión del servidor y lo coloca en la cabecera
// Authorization de la petición, para que los microservicios (y las rutas
// locales como /usuarios) puedan verificarlo sin que el navegador lo envíe.
const injectSessionToken = (req, res, next) => {
  if (!req.headers['authorization'] && req.session && req.session.token) {
    req.headers['authorization'] = `Bearer ${req.session.token}`;
  }
  next();
};

module.exports = injectSessionToken;