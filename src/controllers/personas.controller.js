const pool = require('../config/db');
const { crearError } = require('../utils/errores');
const {
  enteroPositivo,
  validarHijos,
  validarMinisterios,
  validarPersona
} = require('../utils/validaciones');

const CAMPOS_PERSONA = [
  'nombres', 'apellidos', 'cedula', 'fecha_nacimiento', 'sexo', 'telefono', 'correo',
  'estado_relacion', 'fecha_matrimonio', 'fecha_ingreso', 'cargo_id', 'canal_preferido', 'consentimiento'
];

const EXPRESION_CATEGORIA = `CASE WHEN
  (DATE_PART('year', AGE(CURRENT_DATE, p.fecha_ingreso)) * 12
    + DATE_PART('month', AGE(CURRENT_DATE, p.fecha_ingreso))) <
  COALESCE((SELECT valor::int FROM configuracion WHERE clave = 'meses_categoria_nuevo'), 3)
  THEN 'Nuevo' ELSE 'Miembro' END`;

function normalizarPersona(datos) {
  const normalizados = { ...datos };
  for (const campo of ['cedula', 'correo', 'fecha_matrimonio']) {
    if (normalizados[campo] === '') normalizados[campo] = null;
  }
  if (normalizados.nombres) normalizados.nombres = normalizados.nombres.trim();
  if (normalizados.apellidos) normalizados.apellidos = normalizados.apellidos.trim();
  if (normalizados.telefono) normalizados.telefono = normalizados.telefono.trim();
  if (normalizados.correo) normalizados.correo = normalizados.correo.trim();
  return normalizados;
}

function validarDatosPersona(datos, incluirRelaciones = false) {
  const errores = validarPersona(datos);
  if (incluirRelaciones) {
    errores.push(...validarHijos(datos.hijos));
    errores.push(...validarMinisterios(datos.ministerios));
  }
  return errores;
}

function filtrosPersonas(query) {
  const condiciones = ['p.activo = TRUE'];
  const valores = [];
  function agregar(condicion, valor) {
    valores.push(valor);
    condiciones.push(condicion.replace('?', `$${valores.length}`));
  }

  if (query.buscar) {
    valores.push(`%${query.buscar}%`);
    const parametro = `$${valores.length}`;
    condiciones.push(`(p.nombres ILIKE ${parametro} OR p.apellidos ILIKE ${parametro}
      OR COALESCE(p.cedula, '') ILIKE ${parametro} OR p.telefono ILIKE ${parametro})`);
  }
  if (query.sexo !== undefined) {
    if (!['M', 'F'].includes(query.sexo)) throw crearError(400, 'Filtros inválidos', ['sexo debe ser M o F']);
    agregar('p.sexo = ?', query.sexo);
  }
  if (query.estado_relacion !== undefined) {
    agregar('p.estado_relacion = ?', query.estado_relacion);
  }
  if (query.canal_preferido !== undefined) {
    agregar('p.canal_preferido = ?', query.canal_preferido);
  }
  if (query.cargo_id !== undefined) {
    if (!enteroPositivo(query.cargo_id)) throw crearError(400, 'Filtros inválidos', ['cargo_id debe ser positivo']);
    agregar('p.cargo_id = ?', Number(query.cargo_id));
  }
  if (query.ministerio_id !== undefined) {
    if (!enteroPositivo(query.ministerio_id)) throw crearError(400, 'Filtros inválidos', ['ministerio_id debe ser positivo']);
    agregar('EXISTS (SELECT 1 FROM persona_ministerio pm WHERE pm.persona_id = p.id AND pm.ministerio_id = ?)', Number(query.ministerio_id));
  }
  if (query.tiene_hijos !== undefined) {
    if (!['true', 'false'].includes(query.tiene_hijos)) {
      throw crearError(400, 'Filtros inválidos', ['tiene_hijos debe ser true o false']);
    }
    const operador = query.tiene_hijos === 'true' ? 'EXISTS' : 'NOT EXISTS';
    condiciones.push(`${operador} (SELECT 1 FROM hijos h WHERE h.persona_id = p.id)`);
  }
  for (const campo of ['edad_min', 'edad_max']) {
    if (query[campo] !== undefined) {
      if (!/^\d+$/.test(query[campo]) || Number(query[campo]) > 120) {
        throw crearError(400, 'Filtros inválidos', [`${campo} debe ser un entero entre 0 y 120`]);
      }
      agregar(
        `DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento))::int ${campo === 'edad_min' ? '>=' : '<='} ?`,
        Number(query[campo])
      );
    }
  }
  if (query.categoria !== undefined) {
    if (typeof query.categoria !== 'string' || !['nuevo', 'miembro'].includes(query.categoria.toLowerCase())) {
      throw crearError(400, 'Filtros inválidos', ['categoria debe ser nuevo o miembro']);
    }
    condiciones.push(`${EXPRESION_CATEGORIA} = '${query.categoria.toLowerCase() === 'nuevo' ? 'Nuevo' : 'Miembro'}'`);
  }
  if (query.estado_relacion !== undefined &&
      !['soltero', 'noviazgo', 'casado', 'union_libre', 'divorciado', 'viudo'].includes(query.estado_relacion)) {
    throw crearError(400, 'Filtros inválidos', ['estado_relacion no es válido']);
  }
  if (query.canal_preferido !== undefined &&
      !['correo', 'whatsapp', 'sms', 'llamada'].includes(query.canal_preferido)) {
    throw crearError(400, 'Filtros inválidos', ['canal_preferido no es válido']);
  }
  return { condiciones, valores };
}

async function listarPersonas(req, res) {
  const pagina = req.query.pagina === undefined ? 1 : Number(req.query.pagina);
  const limite = req.query.limite === undefined ? 20 : Number(req.query.limite);
  if (!Number.isInteger(pagina) || pagina < 1 || !Number.isInteger(limite) || limite < 1 || limite > 100) {
    throw crearError(400, 'Paginación inválida', ['pagina debe ser positiva y limite debe estar entre 1 y 100']);
  }
  const { condiciones, valores } = filtrosPersonas(req.query);
  const where = condiciones.join(' AND ');
  const totalQuery = await pool.query(`SELECT COUNT(*)::int AS total FROM personas p WHERE ${where}`, valores);
  const parametros = [...valores, limite, (pagina - 1) * limite];
  const resultado = await pool.query(
    `SELECT p.id, p.nombres, p.apellidos, p.cedula, p.fecha_nacimiento, p.sexo,
      p.telefono, p.correo, p.estado_relacion, p.fecha_ingreso, p.cargo_id,
      p.canal_preferido, DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento))::int AS edad,
      ${EXPRESION_CATEGORIA} AS categoria, c.nombre AS cargo,
      (SELECT COUNT(*)::int FROM hijos h WHERE h.persona_id = p.id) AS cantidad_hijos
     FROM personas p JOIN cargos c ON c.id = p.cargo_id
     WHERE ${where}
     ORDER BY p.apellidos, p.nombres
     LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
    parametros
  );
  return res.json({
    datos: resultado.rows,
    total: totalQuery.rows[0].total,
    pagina,
    limite
  });
}

async function obtenerPersona(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query(
    `SELECT p.id, p.nombres, p.apellidos, p.cedula, p.fecha_nacimiento, p.sexo,
      p.telefono, p.correo, p.estado_relacion, p.fecha_matrimonio, p.fecha_ingreso,
      p.cargo_id, p.canal_preferido, p.consentimiento, p.activo,
      DATE_PART('year', AGE(CURRENT_DATE, p.fecha_nacimiento))::int AS edad,
      CASE WHEN p.estado_relacion = 'casado' AND p.fecha_matrimonio IS NOT NULL
        THEN DATE_PART('year', AGE(CURRENT_DATE, p.fecha_matrimonio))::int ELSE NULL END AS anos_matrimonio,
      ${EXPRESION_CATEGORIA} AS categoria, c.nombre AS cargo,
      COALESCE((SELECT json_agg(json_build_object('id', h.id, 'nombre', h.nombre,
        'fecha_nacimiento', to_char(h.fecha_nacimiento, 'YYYY-MM-DD')) ORDER BY h.nombre)
        FROM hijos h WHERE h.persona_id = p.id), '[]'::json) AS hijos,
      COALESCE((SELECT json_agg(json_build_object('id', m.id, 'nombre', m.nombre) ORDER BY m.nombre)
        FROM persona_ministerio pm JOIN ministerios m ON m.id = pm.ministerio_id
        WHERE pm.persona_id = p.id), '[]'::json) AS ministerios
     FROM personas p JOIN cargos c ON c.id = p.cargo_id
     WHERE p.id = $1 AND p.activo = TRUE`,
    [Number(req.params.id)]
  );
  if (!resultado.rowCount) throw crearError(404, 'La persona no existe');
  return res.json({ datos: resultado.rows[0] });
}

async function crearPersona(req, res) {
  const errores = validarDatosPersona(req.body || {}, true);
  if (errores.length) throw crearError(400, 'Datos de persona inválidos', errores);
  const datos = normalizarPersona(req.body);
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const campos = CAMPOS_PERSONA;
    const parametros = campos.map((campo) => datos[campo] === undefined ? null : datos[campo]);
    const columnas = [...campos, 'fecha_consentimiento'];
    const marcadores = columnas.map((_, indice) => `$${indice + 1}`);
    const persona = await cliente.query(
      `INSERT INTO personas (${columnas.join(', ')}) VALUES (${marcadores.join(', ')}) RETURNING id`,
      [...parametros.slice(0, campos.length), new Date()]
    );
    const personaId = persona.rows[0].id;
    for (const hijo of datos.hijos || []) {
      await cliente.query(
        'INSERT INTO hijos (persona_id, nombre, fecha_nacimiento) VALUES ($1, $2, $3)',
        [personaId, hijo.nombre.trim(), hijo.fecha_nacimiento]
      );
    }
    for (const ministerioId of datos.ministerios || []) {
      await cliente.query(
        'INSERT INTO persona_ministerio (persona_id, ministerio_id) VALUES ($1, $2)',
        [personaId, Number(ministerioId)]
      );
    }
    await cliente.query('COMMIT');
    return res.status(201).json({ mensaje: 'Persona registrada', datos: { id: personaId } });
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }
}

async function actualizarPersona(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const errores = validarDatosPersona(req.body || {});
  if (errores.length) throw crearError(400, 'Datos de persona inválidos', errores);
  const datos = normalizarPersona(req.body);
  const columnas = CAMPOS_PERSONA.map((campo) => `${campo} = $${CAMPOS_PERSONA.indexOf(campo) + 1}`);
  const parametros = CAMPOS_PERSONA.map((campo) => datos[campo] === undefined ? null : datos[campo]);
  parametros.push(Number(req.params.id));
  const resultado = await pool.query(
    `UPDATE personas SET ${columnas.join(', ')}, fecha_consentimiento = NOW(),
      actualizado_en = NOW()
     WHERE id = $${parametros.length} AND activo = TRUE RETURNING id`,
    parametros
  );
  if (!resultado.rowCount) throw crearError(404, 'La persona no existe');
  return res.json({ mensaje: 'Persona actualizada', datos: { id: resultado.rows[0].id } });
}

async function eliminarPersona(req, res) {
  if (!enteroPositivo(req.params.id)) throw crearError(400, 'Identificador inválido');
  const resultado = await pool.query(
    'UPDATE personas SET activo = FALSE, actualizado_en = NOW() WHERE id = $1 AND activo = TRUE RETURNING id',
    [Number(req.params.id)]
  );
  if (!resultado.rowCount) throw crearError(404, 'La persona no existe');
  return res.json({ mensaje: 'Persona eliminada', datos: { id: resultado.rows[0].id } });
}

module.exports = {
  actualizarPersona,
  crearPersona,
  eliminarPersona,
  listarPersonas,
  obtenerPersona
};
