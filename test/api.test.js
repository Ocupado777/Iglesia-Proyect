const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-for-api-tests-only';
const app = require('../src/app');

let servidor;
let baseUrl;

test.before(async () => {
  servidor = app.listen(0);
  await new Promise((resolve) => servidor.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    servidor.close((error) => error ? reject(error) : resolve());
  });
});

test('requiere token para cada endpoint privado', async () => {
  const peticiones = [
    ['GET', '/api/auth/perfil'],
    ['GET', '/api/cargos'],
    ['GET', '/api/personas'],
    ['GET', '/api/personas/1'],
    ['POST', '/api/personas'],
    ['PUT', '/api/personas/1'],
    ['DELETE', '/api/personas/1'],
    ['GET', '/api/personas/1/hijos'],
    ['POST', '/api/personas/1/hijos'],
    ['DELETE', '/api/hijos/1'],
    ['GET', '/api/ministerios'],
    ['GET', '/api/ministerios/1'],
    ['POST', '/api/ministerios'],
    ['POST', '/api/ministerios/1/personas'],
    ['GET', '/api/servicios'],
    ['GET', '/api/servicios/1'],
    ['POST', '/api/servicios'],
    ['GET', '/api/eventos'],
    ['GET', '/api/eventos/1'],
    ['POST', '/api/eventos'],
    ['GET', '/api/aniversarios']
  ];

  for (const [method, path] of peticiones) {
    const respuesta = await fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'POST' || method === 'PUT' ? '{}' : undefined
    });
    assert.equal(respuesta.status, 401, `${method} ${path} debe requerir autenticación`);
  }

  const solicitudInvalida = await fetch(`${baseUrl}/api/personas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{'
  });
  assert.equal(solicitudInvalida.status, 401);
});

test('el inicio de sesión es público y valida los campos requeridos', async () => {
  const respuesta = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: 'admin@example.com' })
  });
  assert.equal(respuesta.status, 400);
});

test('devuelve 404 para rutas desconocidas con token válido', async () => {
  const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
  const respuesta = await fetch(`${baseUrl}/api/no-existe`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.equal(respuesta.status, 404);
});
