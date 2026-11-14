require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const puerto = Number(process.env.PORT || 3000);
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32 ||
    process.env.JWT_SECRET === 'reemplaza_esta_clave_por_una_cadena_secreta_larga') {
  console.error('Configura un JWT_SECRET propio de al menos 32 caracteres en el archivo .env.');
  process.exit(1);
}

const servidor = app.listen(puerto, () => {
  console.log(`API disponible en http://localhost:${puerto}/api`);
});

servidor.on('error', (error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exitCode = 1;
});

process.on('SIGINT', async () => {
  await pool.end();
  servidor.close(() => process.exit(0));
});

process.on('SIGTERM', async () => {
  await pool.end();
  servidor.close(() => process.exit(0));
});
