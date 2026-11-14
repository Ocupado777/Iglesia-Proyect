const pool = require('../config/db');

async function obtenerCargos(req, res) {
  const resultado = await pool.query('SELECT id, nombre FROM cargos ORDER BY nombre');
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

async function obtenerAniversarios(req, res) {
  const resultado = await pool.query(
    'SELECT id, nombre, mes, dias, descripcion FROM aniversarios ORDER BY mes, nombre'
  );
  return res.json({ datos: resultado.rows, total: resultado.rowCount, pagina: 1, limite: resultado.rowCount });
}

module.exports = { obtenerAniversarios, obtenerCargos };
