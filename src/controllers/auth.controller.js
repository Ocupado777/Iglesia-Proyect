const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function iniciarSesion(req, res) {
  const { correo, password } = req.body || {};
  if (typeof correo !== 'string' || typeof password !== 'string' || !correo || !password) {
    return res.status(400).json({
      error: 'Datos de inicio de sesión inválidos',
      detalles: ['correo y password son obligatorios']
    });
  }

  const resultado = await pool.query(
    'SELECT id, nombre, correo, password_hash FROM usuarios WHERE correo = $1 AND activo = TRUE',
    [correo]
  );
  const usuario = resultado.rows[0];
  if (!usuario || !(await bcrypt.compare(password, usuario.password_hash))) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos', detalles: [] });
  }

  const token = jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || '8h' }
  );
  return res.json({
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo }
  });
}

async function obtenerPerfil(req, res) {
  const resultado = await pool.query(
    'SELECT id, nombre, correo FROM usuarios WHERE id = $1 AND activo = TRUE',
    [req.usuario.id]
  );
  if (!resultado.rowCount) {
    return res.status(404).json({ error: 'El usuario ya no existe o está inactivo', detalles: [] });
  }
  return res.json({ datos: resultado.rows[0] });
}

module.exports = { iniciarSesion, obtenerPerfil };
