const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./lib');

test('el prompt de IA identifica explícitamente solo el vehículo activo', () => {
  const prompt = L.buildSystemPrompt({
    plate: 'GZGJ74', marca: 'GREAT WALL', modelo: '3', anio: '2015',
    combustible: 'Gasolina', motor: 'GW4G15'
  });
  assert.match(prompt, /CONTEXTO ACTIVO ÚNICO/);
  assert.match(prompt, /GZGJ74/);
  assert.match(prompt, /GREAT WALL 3/);
  assert.match(prompt, /GW4G15/);
  assert.match(prompt, /No reutilices, mezcles ni supongas datos de otro vehículo/i);
  assert.doesNotMatch(prompt, /TOYOTA YARIS/i);
});

test('patentes se normalizan antes de crear contexto', () => {
  assert.equal(L.cleanPlate('gz-gj 74'), 'GZGJ74');
  assert.equal(L.isPlateOk('GZGJ74'), true);
});

test('datos técnicos confirmados manualmente tienen prioridad y bloquean inferencias de cilindrada', () => {
  const prompt = L.buildSystemPrompt({
    plate: 'GZGJ74', marca: 'GREAT WALL', modelo: '3', anio: '2015',
    combustible: 'Gasolina', motor: 'SERIAL-123', cilindrada: '',
    manualIdentity: { cilindrada: '2.0 L', codigoMotor: 'GW4D20', chasis: 'LGWTESTVIN1234567' }
  });
  assert.match(prompt, /DATOS CONFIRMADOS POR EL USUARIO/);
  assert.match(prompt, /cilindrada: 2\.0 L/i);
  assert.match(prompt, /código de motor: GW4D20/i);
  assert.match(prompt, /prioridad absoluta/i);
  assert.match(prompt, /NO deduzcas una cilindrada exacta/i);
  assert.doesNotMatch(prompt, /1\.5 L/i);
});
