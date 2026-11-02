'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeVehicle } = require('./vehicleProvider');

test('merge conserva identificadores ya obtenidos y completa vacíos', () => {
  const got = mergeVehicle(
    { plate: 'ABCD12', chasis: 'VIN-A', motor: '' },
    { chasis: 'VIN-B', motor: 'MOTOR-1', marca: 'TOYOTA' }
  );
  assert.equal(got.chasis, 'VIN-A');
  assert.equal(got.motor, 'MOTOR-1');
  assert.equal(got.marca, 'TOYOTA');
});

test('merge conserva arrays útiles de fuentes', () => {
  const got = mergeVehicle({ plate: 'ABCD12' }, { siiCoincidencias: [{version:'2.0'}] });
  assert.equal(got.siiCoincidencias.length, 1);
});

test('si una fuente gratuita entrega una ficha útil no consume Boostr', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.BOOSTR_API_KEY;
  process.env.BOOSTR_API_KEY = 'dummy-key';
  const calls = [];
  global.fetch = async (url) => {
    const u = String(url); calls.push(u);
    if (u.includes('autoriesgo.cl')) return {
      ok:true,status:200,headers:{get(){return null}},
      json:async()=>({patente:'GZGJ74',vehicle_data:{plate:'GZGJ74',make:'GREAT WALL',model:'HOVER',year:2015,vin:'VIN123456789'}})
    };
    if (u.includes('vehiculos-revisiones')) return {ok:false,status:404,headers:{get(){return null}},json:async()=>({})};
    if (u.includes('api.boostr')) throw new Error('Boostr no debía llamarse');
    return {ok:false,status:404,headers:{get(){return null}},json:async()=>({})};
  };
  try {
    const { lookupVehicleMulti } = require('./vehicleProvider');
    const got = await lookupVehicleMulti('GZGJ74');
    assert.equal(got.vehicle.chasis, 'VIN123456789');
    assert.equal(got.vehicle.marca, 'GREAT WALL');
    assert.equal(calls.some((u)=>u.includes('api.boostr')), false);
  } finally {
    global.fetch = oldFetch;
    if (oldKey === undefined) delete process.env.BOOSTR_API_KEY; else process.env.BOOSTR_API_KEY = oldKey;
  }
});
