'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapPrtRecord, enrichWithUnambiguousSii } = require('./restartProvider');

test('mapea una revisión PRT sin inventar datos ausentes', () => {
  const v = mapPrtRecord({ attributes: {
    ppu: 'GZGJ74', marca: 'GREAT WALL', modelo: 'HOVER', fecha_revision: '2026-05-10', resultado: 'A'
  }}, 'GZGJ74');
  assert.equal(v.plate, 'GZGJ74');
  assert.equal(v.marca, 'GREAT WALL');
  assert.equal(v.modelo, 'HOVER');
  assert.equal(v.revisionTecnica, '2026-05-10');
  assert.equal(v.cilindrada, undefined);
  assert.equal(v.chasis, undefined);
});

test('SII sólo enriquece datos técnicos cuando hay una coincidencia única', () => {
  const base = { plate: 'GZGJ74', marca: 'GREAT WALL', modelo: 'HOVER', anio: '2015' };
  const ambiguous = enrichWithUnambiguousSii(base, [
    { version: '2.0 4X2', cilindrada: '2.0' },
    { version: '2.4 4X4', cilindrada: '2.4' }
  ]).vehicle;
  assert.equal(ambiguous.cilindrada, undefined);
  assert.equal(ambiguous.version, undefined);
  assert.equal(ambiguous.siiCoincidencias.length, 2);

  const exact = enrichWithUnambiguousSii(base, [
    { codigoSii: 'ABC123', version: '2.0 4X2', cilindrada: '2.0', tasacionFiscal: '4500000' }
  ]).vehicle;
  assert.equal(exact.cilindrada, '2.0');
  assert.equal(exact.version, '2.0 4X2');
  assert.equal(exact.codigoSii, 'ABC123');
});
