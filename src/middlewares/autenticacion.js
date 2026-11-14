const jwt = require('jsonwebtoken');

function autenticacion(req, res, next) {
  const autorizacion = req.get('Authorization') || '';
  const coincidencia = autorizacion.match(/^Bearer\s+(.+)$/i);
  if (!coincidencia) {
    return res.status(401).json({ error: 'Se requiere un token de autenticación', detalles: [] });
  }

  try {
    req.usuario = jwt.verify(coincidencia[1], process.env.JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'El token es inválido o ha expirado', detalles: [] });
    }
    return next(error);
  }
}

module.exports = autenticacion;
