const test = require('node:test');
const assert = require('node:assert/strict');
const {
  enteroPositivo,
  fechaValida,
  horaValida,
  validarHijos,
  validarMinisterios,
  validarPersona
} = require('../src/utils/validaciones');

const personaValida = {
  nombres: 'Ana',
  apellidos: 'Pérez',
  fecha_nacimiento: '1995-05-10',
  sexo: 'F',
  telefono: '0991234567',
  estado_relacion: 'soltero',
  fecha_ingreso: '2025-01-01',
  cargo_id: 1,
  canal_preferido: 'whatsapp',
  consentimiento: true
};

test('valida fechas de calendario y rechaza fechas futuras cuando aplica', () => {
  assert.equal(fechaValida('2024-02-29'), true);
  assert.equal(fechaValida('2025-02-29'), false);
  assert.equal(fechaValida('2999-01-01'), false);
  assert.equal(fechaValida('2999-01-01', true), true);
});

test('valida identificadores y horarios en formato esperado', () => {
  assert.equal(enteroPositivo(1), true);
  assert.equal(enteroPositivo('12'), true);
  assert.equal(enteroPositivo(true), false);
  assert.equal(horaValida('19:30'), true);
  assert.equal(horaValida('25:30'), false);
  assert.equal(horaValida('19:30:00'), false);
});

test('valida el consentimiento y las reglas de contacto de una persona', () => {
  assert.deepEqual(validarPersona(personaValida), []);
  assert.ok(validarPersona({ ...personaValida, consentimiento: false }).includes('se requiere consentimiento informado'));
  assert.ok(validarPersona({ ...personaValida, canal_preferido: 'correo' })
    .includes('correo es obligatorio cuando canal_preferido es correo'));
});

test('valida relaciones hijas y ministerios sin aceptar identificadores inválidos', () => {
  assert.deepEqual(validarHijos([{ nombre: 'Luis', fecha_nacimiento: '2015-03-01' }]), []);
  assert.ok(validarHijos([{ nombre: '', fecha_nacimiento: '2015-03-01' }]).length > 0);
  assert.deepEqual(validarMinisterios([1, 2]), []);
  assert.ok(validarMinisterios([1, 1]).length > 0);
  assert.ok(validarMinisterios([true]).length > 0);
});
