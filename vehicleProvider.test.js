'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

function response(status, payload, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get(name) { return headers[String(name).toLowerCase()] || ''; } },
    async json() { return payload; }
  };
}

test('usa PRT/reSTART como fuente principal y no toca Boostr si PRT encuentra el vehículo', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.BOOSTR_API_KEY;
  process.env.BOOSTR_API_KEY = 'test-key';
  const urls = [];
  global.fetch = async (url) => {
    const u = String(url); urls.push(u);
    if (u.includes('/vehiculos-revisiones/')) return response(200, { data: [{ attributes: { ppu:'GZGJ74', marca:'GREAT WALL', modelo:'HOVER', anio:'2015', fecha_revision:'2026-04-01' } }] });
    if (u.includes('/vehiculos-tasacion')) return response(200, { data: [] });
    if (u.includes('api.boostr.cl')) throw new Error('Boostr no debería llamarse');
    throw new Error('URL inesperada '+u);
  };
  delete require.cache[require.resolve('./vehicleProvider')];
  const { lookupVehicleMulti } = require('./vehicleProvider');
  const out = await lookupVehicleMulti('GZGJ74');
  assert.equal(out.vehicle.marca, 'GREAT WALL');
  assert.match(out.source, /PRT\/reSTART/);
  assert.equal(urls.some((u) => u.includes('api.boostr.cl')), false);
  global.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.BOOSTR_API_KEY; else process.env.BOOSTR_API_KEY = oldKey;
});

test('usa Boostr sólo como fallback cuando PRT no encuentra la patente', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.BOOSTR_API_KEY;
  process.env.BOOSTR_API_KEY = 'test-key';
  const urls = [];
  global.fetch = async (url) => {
    const u = String(url); urls.push(u);
    if (u.includes('/vehiculos-revisiones/')) return response(404, { error:'not found' });
    if (u.includes('api.boostr.cl')) return response(200, { status:'success', data:{ plate:'BCYT91', make:'TOYOTA', model:'YARIS', year:'2009', engine:'1NZ123456' } });
    throw new Error('URL inesperada '+u);
  };
  delete require.cache[require.resolve('./vehicleProvider')];
  const { lookupVehicleMulti } = require('./vehicleProvider');
  const out = await lookupVehicleMulti('BCYT91');
  assert.equal(out.vehicle.marca, 'TOYOTA');
  assert.equal(out.source, 'Boostr fallback');
  assert.equal(urls.some((u) => u.includes('api.boostr.cl')), true);
  global.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.BOOSTR_API_KEY; else process.env.BOOSTR_API_KEY = oldKey;
});

test('no gasta Boostr cuando reSTART sólo está rate-limited', async () => {
  const oldFetch = global.fetch;
  const oldKey = process.env.BOOSTR_API_KEY;
  process.env.BOOSTR_API_KEY = 'test-key';
  const urls = [];
  global.fetch = async (url) => {
    const u = String(url); urls.push(u);
    if (u.includes('/vehiculos-revisiones/')) return response(429, { error:'rate' }, { 'retry-after':'8' });
    if (u.includes('api.boostr.cl')) throw new Error('No debe gastar Boostr ante rate limit temporal');
    throw new Error('URL inesperada '+u);
  };
  delete require.cache[require.resolve('./vehicleProvider')];
  const { lookupVehicleMulti } = require('./vehicleProvider');
  await assert.rejects(() => lookupVehicleMulti('GZGJ74'), (e) => e && e.code === 'RESTART_RATE_LIMIT');
  assert.equal(urls.some((u) => u.includes('api.boostr.cl')), false);
  global.fetch = oldFetch;
  if (oldKey === undefined) delete process.env.BOOSTR_API_KEY; else process.env.BOOSTR_API_KEY = oldKey;
});
