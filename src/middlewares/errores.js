function rutaNoEncontrada(req, res) {
  res.status(404).json({ error: 'La ruta solicitada no existe', detalles: [] });
}

function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON válido', detalles: [] });
  }
  if (error.code === '23505') {
    return res.status(409).json({ error: 'El registro ya existe', detalles: [] });
  }
  if (error.code === '23503') {
    return res.status(400).json({ error: 'Uno de los identificadores relacionados no existe', detalles: [] });
  }
  if (error.code === '23514' || error.code === '22P02') {
    return res.status(400).json({ error: 'Los datos enviados no son válidos', detalles: [] });
  }
  if (error.estado) {
    return res.status(error.estado).json({
      error: error.message,
      detalles: error.detalles || []
    });
  }

  console.error('Error interno de la API:', error);
  return res.status(500).json({ error: 'Ocurrió un error interno', detalles: [] });
}

module.exports = { manejarErrores, rutaNoEncontrada };
