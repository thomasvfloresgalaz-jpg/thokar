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
