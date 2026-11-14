require('dotenv').config();
const bcrypt = require('bcryptjs');
const readline = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const pool = require('../config/db');

async function crearAdministrador() {
  const interfaz = readline.createInterface({ input: stdin, output: stdout });
  try {
    const nombre = (await interfaz.question('Nombre del administrador: ')).trim();
    const correo = (await interfaz.question('Correo del administrador: ')).trim();
    const password = await interfaz.question('Contraseña: ');
    if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || password.length < 8) {
      throw new Error('Ingresa un nombre, correo válido y una contraseña de al menos 8 caracteres.');
    }

    const hash = await bcrypt.hash(password, 12);
    const resultado = await pool.query(
      'INSERT INTO usuarios (nombre, correo, password_hash) VALUES ($1, $2, $3) RETURNING id, nombre, correo',
      [nombre, correo, hash]
    );
    console.log('Administrador creado:', resultado.rows[0]);
  } finally {
    interfaz.close();
    await pool.end();
  }
}

crearAdministrador().catch((error) => {
  console.error('No se pudo crear el administrador:', error.message);
  process.exitCode = 1;
});
