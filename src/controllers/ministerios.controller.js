const pool = require('../config/db');
const { crearError } = require('../utils/errores');
const { enteroPositivo } = require('../utils/validaciones');

async function listarMinisterios(req, res) {
  const resultado = await pool.query(
    `SELECT m.id, m.nombre, m.descripcion,
      COUNT(p.id)::int AS cantidad_integrantes
     FROM ministerios m
     LEFT JOIN persona_ministerio pm ON pm.ministerio_id = m.id
     LEFT JOIN personas p ON p.id = pm.persona_id AND p.activo = TRUE
     GROUP BY m.id ORDER BY m.nombre`
  );
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

async function obtenerMinisterio(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query(
    `SELECT m.id, m.nombre, m.descripcion,
      COALESCE(json_agg(json_build_object('id', p.id, 'nombres', p.nombres,
        'apellidos', p.apellidos) ORDER BY p.apellidos, p.nombres)
        FILTER (WHERE p.id IS NOT NULL), '[]'::json) AS integrantes
     FROM ministerios m
     LEFT JOIN persona_ministerio pm ON pm.ministerio_id = m.id
     LEFT JOIN personas p ON p.id = pm.persona_id AND p.activo = TRUE
     WHERE m.id = $1 GROUP BY m.id`,
    [Number(req.params.id)]
  );
  if (!resultado.rowCount) throw crearError(404, 'El ministerio no existe');
  return res.json({ datos: resultado.rows[0] });
}

async function crearMinisterio(req, res) {
  const { nombre, descripcion = null } = req.body || {};
  if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > 80) {
    throw crearError(400, 'Datos de ministerio inválidos', ['nombre es obligatorio y no debe superar 80 caracteres']);
  }
  if (descripcion !== null && (typeof descripcion !== 'string' || descripcion.length > 255)) {
    throw crearError(400, 'Datos de ministerio inválidos', ['descripcion debe ser texto de máximo 255 caracteres']);
  }
  const resultado = await pool.query(
    'INSERT INTO ministerios (nombre, descripcion) VALUES ($1, $2) RETURNING id, nombre, descripcion',
    [nombre.trim(), descripcion ? descripcion.trim() : null]
  );
  return res.status(201).json({ mensaje: 'Ministerio creado', datos: resultado.rows[0] });
}

async function asignarPersona(req, res) {
  const ministerioId = req.params.id;
  const personaId = req.body && req.body.persona_id;
  if (!enteroPositivo(ministerioId) || !enteroPositivo(personaId)) {
    throw crearError(400, 'Datos de asignación inválidos', ['id de ministerio y persona_id deben ser enteros positivos']);
  }
  const resultado = await pool.query(
    `INSERT INTO persona_ministerio (persona_id, ministerio_id)
     VALUES ($1, $2) RETURNING persona_id, ministerio_id`,
    [Number(personaId), Number(ministerioId)]
  );
  return res.status(201).json({ mensaje: 'Persona asignada al ministerio', datos: resultado.rows[0] });
}

module.exports = { asignarPersona, crearMinisterio, listarMinisterios, obtenerMinisterio };
