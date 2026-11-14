function crearError(estado, mensaje, detalles = []) {
  const error = new Error(mensaje);
  error.estado = estado;
  error.detalles = detalles;
  return error;
}

module.exports = { crearError };
