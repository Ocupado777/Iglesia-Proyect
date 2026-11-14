const pool = require('../config/db');
const { crearError } = require('../utils/errores');
const { enteroPositivo, fechaValida } = require('../utils/validaciones');

async function listarHijos(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const persona = await pool.query('SELECT id FROM personas WHERE id = $1 AND activo = TRUE', [Number(req.params.id)]);
  if (!persona.rowCount) throw crearError(404, 'La persona no existe');
  const resultado = await pool.query(
    `SELECT id, persona_id, nombre, to_char(fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento
     FROM hijos WHERE persona_id = $1 ORDER BY nombre`,
    [Number(req.params.id)]
  );
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

async function crearHijo(req, res) {
  const { nombre, fecha_nacimiento: fechaNacimiento } = req.body || {};
  const errores = [];
  if (typeof nombre !== 'string' || !nombre.trim()) errores.push('nombre es obligatorio');
  if (!fechaValida(fechaNacimiento)) errores.push('fecha_nacimiento debe ser válida YYYY-MM-DD y no futura');
  if (!enteroPositivo(req.params.id)) errores.push('id de persona inválido');
  if (errores.length) throw crearError(400, 'Datos de hijo inválidos', errores);
  const persona = await pool.query('SELECT id FROM personas WHERE id = $1 AND activo = TRUE', [Number(req.params.id)]);
  if (!persona.rowCount) throw crearError(404, 'La persona no existe');
  const resultado = await pool.query(
    'INSERT INTO hijos (persona_id, nombre, fecha_nacimiento) VALUES ($1, $2, $3) RETURNING id',
    [Number(req.params.id), nombre.trim(), fechaNacimiento]
  );
  return res.status(201).json({ mensaje: 'Hijo registrado', datos: { id: resultado.rows[0].id } });
}

async function eliminarHijo(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query('DELETE FROM hijos WHERE id = $1 RETURNING id', [Number(req.params.id)]);
  if (!resultado.rowCount) throw crearError(404, 'El hijo no existe');
  return res.json({ mensaje: 'Hijo eliminado', datos: { id: resultado.rows[0].id } });
}

module.exports = { crearHijo, eliminarHijo, listarHijos };
