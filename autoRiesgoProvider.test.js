'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mapAutoRiesgoVehicle, lookupVehicle } = require('./autoRiesgoProvider');

test('mapea la respuesta documentada de agent/lookup', () => {
  const got = mapAutoRiesgoVehicle({
    plate: 'BCYT91',
    make: 'HYUNDAI',
    model: 'SONATA',
    year: 2015
  }, 'BCYT91');

  assert.equal(got.plate, 'BCYT91');
  assert.equal(got.marca, 'HYUNDAI');
  assert.equal(got.modelo, 'SONATA');
  assert.equal(got.anio, '2015');
});

test('mapea campos técnicos adicionales y anidados cuando existen', () => {
  const got = mapAutoRiesgoVehicle({
    plate: 'ABCD12',
    make: 'TOYOTA',
    model: 'YARIS',
    year: '2009',
    vin: 'JTDTEST123',
    engine_number: '1NZ12345',
    color: 'GRIS',
    mileage: 183420,
    fuel: 'Gasolina',
    prt: { status_label: 'Vigente', month: 'Mayo' }
  }, 'ABCD12');

  assert.equal(got.chasis, 'JTDTEST123');
  assert.equal(got.motor, '1NZ12345');
  assert.equal(got.kmRegistrado, '183420');
  assert.equal(got.revisionTecnica, 'Vigente');
  assert.equal(got.mesRevision, 'Mayo');
});

test('lookup usa el endpoint agent sin API key e ignora campos ajenos a vehicle_data', async () => {
  const oldFetch = global.fetch;
  let requestedUrl = '';
  let requestedHeaders = null;
  global.fetch = async (url, options) => {
    requestedUrl = String(url);
    requestedHeaders = options.headers;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        patente: 'BCYT91',
        owner: { name: 'NO DEBE PASAR', rut: '11.111.111-1' },
        vehicle_data: { plate: 'BCYT91', make: 'HYUNDAI', model: 'SONATA', year: 2015 },
        purchase_full_report: { available: true }
      })
    };
  };

  try {
    const got = await lookupVehicle('bcyt91');
    assert.match(requestedUrl, /\/api\/v1\/report\/agent\/lookup\?patente=BCYT91$/);
    assert.equal(Object.prototype.hasOwnProperty.call(requestedHeaders, 'x-api-key'), false);
    assert.equal(got.marca, 'HYUNDAI');
    assert.equal(got.modelo, 'SONATA');
    assert.equal('owner' in got, false);
  } finally {
    global.fetch = oldFetch;
  }
});
