const pool = require('../config/db');
const { crearError } = require('../utils/errores');
const { enteroPositivo, fechaValida, horaValida } = require('../utils/validaciones');

async function listarServicios(req, res) {
  const resultado = await pool.query(
    `SELECT id, nombre, tipo, dia_semana, to_char(hora_inicio, 'HH24:MI:SS') AS hora_inicio,
      to_char(hora_fin, 'HH24:MI:SS') AS hora_fin, descripcion, activo
     FROM servicios WHERE activo = TRUE ORDER BY dia_semana NULLS LAST, hora_inicio`
  );
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

async function obtenerServicio(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query(
    `SELECT id, nombre, tipo, dia_semana, to_char(hora_inicio, 'HH24:MI:SS') AS hora_inicio,
      to_char(hora_fin, 'HH24:MI:SS') AS hora_fin, descripcion, activo
     FROM servicios WHERE id = $1 AND activo = TRUE`,
    [Number(req.params.id)]
  );
  if (!resultado.rowCount) throw crearError(404, 'El servicio no existe');
  return res.json({ datos: resultado.rows[0] });
}

async function crearServicio(req, res) {
  const { nombre, tipo, dia_semana: diaSemana = null, hora_inicio: horaInicio, hora_fin: horaFin, descripcion = null } = req.body || {};
  const errores = [];
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 100) {
    errores.push('nombre es obligatorio y no debe superar 100 caracteres');
  }
  if (!['regular', 'especial'].includes(tipo)) errores.push('tipo debe ser regular o especial');
  if (!horaValida(horaInicio) || !horaValida(horaFin)) errores.push('hora_inicio y hora_fin deben usar formato HH:MM');
  if (horaValida(horaInicio) && horaValida(horaFin) && horaFin <= horaInicio) errores.push('hora_fin debe ser mayor que hora_inicio');
  const diaSemanaValido = typeof diaSemana === 'number' ||
    (typeof diaSemana === 'string' && /^\d+$/.test(diaSemana));
  if (diaSemana !== null &&
      (!diaSemanaValido || !Number.isInteger(Number(diaSemana)) || Number(diaSemana) < 1 || Number(diaSemana) > 7)) {
    errores.push('dia_semana debe estar entre 1 y 7');
  }
  if (descripcion !== null && (typeof descripcion !== 'string' || descripcion.length > 255)) {
    errores.push('descripcion debe ser texto de máximo 255 caracteres');
  }
  if (errores.length) throw crearError(400, 'Datos de servicio inválidos', errores);
  const resultado = await pool.query(
    `INSERT INTO servicios (nombre, tipo, dia_semana, hora_inicio, hora_fin, descripcion)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, nombre, tipo, dia_semana, to_char(hora_inicio, 'HH24:MI:SS') AS hora_inicio,
       to_char(hora_fin, 'HH24:MI:SS') AS hora_fin, descripcion`,
    [nombre.trim(), tipo, diaSemana === null ? null : Number(diaSemana), horaInicio, horaFin, descripcion ? descripcion.trim() : null]
  );
  return res.status(201).json({ mensaje: 'Servicio creado', datos: resultado.rows[0] });
}

async function listarEventos(req, res) {
  const { desde, hasta } = req.query;
  if (desde && !fechaValida(desde, true)) throw crearError(400, 'Filtro de fecha inválido', ['desde debe tener formato YYYY-MM-DD']);
  if (hasta && !fechaValida(hasta, true)) throw crearError(400, 'Filtro de fecha inválido', ['hasta debe tener formato YYYY-MM-DD']);
  if (desde && hasta && desde > hasta) throw crearError(400, 'Filtro de fechas inválido', ['desde no puede ser posterior a hasta']);
  const condiciones = [];
  const valores = [];
  if (desde) {
    valores.push(desde);
    condiciones.push(`e.fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`e.fecha <= $${valores.length}`);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const resultado = await pool.query(
    `SELECT e.id, e.servicio_id, e.nombre, to_char(e.fecha, 'YYYY-MM-DD') AS fecha,
      to_char(e.hora_inicio, 'HH24:MI:SS') AS hora_inicio,
      to_char(e.hora_fin, 'HH24:MI:SS') AS hora_fin, e.lugar, e.observacion, e.estado,
      s.nombre AS servicio
     FROM eventos e LEFT JOIN servicios s ON s.id = e.servicio_id
     ${where} ORDER BY e.fecha, e.hora_inicio`,
    valores
  );
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

async function obtenerEvento(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query(
    `SELECT e.id, e.servicio_id, e.nombre, to_char(e.fecha, 'YYYY-MM-DD') AS fecha,
      to_char(e.hora_inicio, 'HH24:MI:SS') AS hora_inicio,
      to_char(e.hora_fin, 'HH24:MI:SS') AS hora_fin, e.lugar, e.observacion, e.estado,
      s.nombre AS servicio
     FROM eventos e LEFT JOIN servicios s ON s.id = e.servicio_id WHERE e.id = $1`,
    [Number(req.params.id)]
  );
  if (!resultado.rowCount) throw crearError(404, 'El evento no existe');
  return res.json({ datos: resultado.rows[0] });
}

async function crearEvento(req, res) {
  const { servicio_id: servicioId = null, nombre, fecha, hora_inicio: horaInicio, hora_fin: horaFin, lugar = null, observacion = null } = req.body || {};
  const errores = [];
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 120) {
    errores.push('nombre es obligatorio y no debe superar 120 caracteres');
  }
  if (!fechaValida(fecha, true)) errores.push('fecha debe ser válida y tener formato YYYY-MM-DD');
  if (!horaValida(horaInicio) || !horaValida(horaFin)) errores.push('hora_inicio y hora_fin deben usar formato HH:MM');
  if (horaValida(horaInicio) && horaValida(horaFin) && horaFin <= horaInicio) errores.push('hora_fin debe ser mayor que hora_inicio');
  if (servicioId !== null && !enteroPositivo(servicioId)) errores.push('servicio_id debe ser un entero positivo');
  for (const [campo, valor] of [['lugar', lugar], ['observacion', observacion]]) {
    if (valor !== null && (typeof valor !== 'string' || valor.length > (campo === 'lugar' ? 150 : 255))) {
      errores.push(`${campo} no debe superar ${campo === 'lugar' ? 150 : 255} caracteres`);
    }
  }
  if (errores.length) throw crearError(400, 'Datos de evento inválidos', errores);
  const resultado = await pool.query(
    `INSERT INTO eventos (servicio_id, nombre, fecha, hora_inicio, hora_fin, lugar, observacion)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, servicio_id, nombre, to_char(fecha, 'YYYY-MM-DD') AS fecha,
       to_char(hora_inicio, 'HH24:MI:SS') AS hora_inicio,
       to_char(hora_fin, 'HH24:MI:SS') AS hora_fin, lugar, observacion, estado`,
    [servicioId === null ? null : Number(servicioId), nombre.trim(), fecha, horaInicio, horaFin, lugar, observacion]
  );
  return res.status(201).json({ mensaje: 'Evento creado', datos: resultado.rows[0] });
}

module.exports = {
  crearEvento,
  crearServicio,
  listarEventos,
  listarServicios,
  obtenerEvento,
  obtenerServicio
};
