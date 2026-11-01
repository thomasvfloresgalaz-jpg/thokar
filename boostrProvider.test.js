const test = require('node:test');
const assert = require('node:assert/strict');
const { mapBoostrVehicle } = require('./boostrProvider');

test('mapea respuesta básica de Boostr y descarta owner', () => {
  const got = mapBoostrVehicle({
    plate: 'ABCD12', dv: '3', make: 'TOYOTA', model: 'YARIS', year: 2009,
    type: 'AUTOMOVIL', engine: '1NZ1234567',
    owner: { fullname: 'PERSONA EJEMPLO', documentNumber: '11.111.111-1' }
  }, 'ABCD12');
  assert.equal(got.plate, 'ABCD12');
  assert.equal(got.marca, 'TOYOTA');
  assert.equal(got.modelo, 'YARIS');
  assert.equal(got.anio, '2009');
  assert.equal(got.motor, '1NZ1234567');
  assert.equal(got.owner, undefined);
  assert.equal(got.fullname, undefined);
  assert.equal(got.documentNumber, undefined);
});

test('mapea campos extendidos documentados por Boostr', () => {
  const got = mapBoostrVehicle({
    plate: 'EL2801', make: 'FORD', model: 'GALAXIE', year: 1966, type: 'AUTOMOVIL',
    engine: '170406', engine_size: '4.1', chassis: '9C170406', color: 'NEGRO', doors: 2,
    kilometers: 76944, gas_type: 'GASOLINA', manufacturer: 'FORD', country: 'USA',
    region: 'NORTEAMERICA', version: '500', transmission: 'AUTOMATICA', sii_code: 'ABC123',
    valuation: 12345678
  }, 'EL2801');
  assert.equal(got.chasis, '9C170406');
  assert.equal(got.color, 'NEGRO');
  assert.equal(got.puertas, '2');
  assert.equal(got.kmRegistrado, '76944');
  assert.equal(got.combustible, 'Gasolina');
  assert.equal(got.cilindrada, '4.1');
  assert.equal(got.transmision, 'AUTOMATICA');
  assert.equal(got.codigoSii, 'ABC123');
  assert.equal(got.tasacionFiscal, '12345678');
});
