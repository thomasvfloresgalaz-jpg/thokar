'use strict';

const { lookupVehicle: lookupBoostrVehicle } = require('./boostrProvider');
const { lookupVehicle: lookupAutoRiesgoVehicle } = require('./autoRiesgoProvider');
const {
  cleanPlate,
  lookupPrtVehicle,
  lookupSiiCandidates,
  enrichWithUnambiguousSii
} = require('./restartProvider');

function isBoostrConfigured() {
  return Boolean(String(process.env.BOOSTR_API_KEY || '').trim());
}

function cleanValue(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

function mergeVehicle(base, incoming) {
  const out = { ...(base || {}) };
  for (const [key, value] of Object.entries(incoming || {})) {
    if (key === 'prtHistorial' || key === 'siiCoincidencias') {
      if (Array.isArray(value) && value.length) out[key] = value;
      continue;
    }
    if (!cleanValue(out[key]) && cleanValue(value)) out[key] = value;
  }
  return out;
}

function useful(vehicle) {
  return ['marca','modelo','anio','tipo','motor','chasis','combustible','cilindrada','procedencia','fabricante'].some((k) => cleanValue(vehicle && vehicle[k]));
}

async function lookupVehicleMulti(plate) {
  const clean = cleanPlate(plate);
  const providerState = { autoriesgo: 'not-run', prt: 'not-run', sii: 'not-run', boostr: 'not-used' };
  let vehicle = { plate: clean };
  let primaryErrors = [];

  // Fuente gratuita pensada para consulta por patente. Solo se procesa vehicle_data.
  try {
    const auto = await lookupAutoRiesgoVehicle(clean);
    vehicle = mergeVehicle(vehicle, auto);
    providerState.autoriesgo = 'ok';
  } catch (error) {
    providerState.autoriesgo = error.code || 'error';
    primaryErrors.push(error);
  }

  // PRT/reSTART + SII complementan la identidad. Si una fuente ya dio VIN, no se reemplaza.
  try {
    let prt = await lookupPrtVehicle(clean);
    providerState.prt = 'ok';
    let siiMeta = { count: 0, exact: false };
    try {
      const candidates = await lookupSiiCandidates(prt);
      const enriched = enrichWithUnambiguousSii(prt, candidates);
      prt = enriched.vehicle;
      siiMeta = enriched.meta;
      providerState.sii = siiMeta.count ? (siiMeta.exact ? 'exact' : 'candidates') : 'empty';
    } catch (error) {
      providerState.sii = error.code || 'error';
    }
    vehicle = mergeVehicle(vehicle, prt);
  } catch (error) {
    providerState.prt = error.code || 'error';
    primaryErrors.push(error);
  }

  if (useful(vehicle)) {
    const parts = [];
    if (providerState.autoriesgo === 'ok') parts.push('AutoRiesgo');
    if (providerState.prt === 'ok') parts.push('PRT/reSTART');
    if (providerState.sii === 'exact' || providerState.sii === 'candidates') parts.push('SII');
    return { vehicle, source: parts.join(' + ') || 'Fuentes públicas', providers: providerState };
  }

  // No gastamos Boostr si alguna fuente gratuita sólo está en rate limit temporal.
  const transientRate = primaryErrors.find((e) => e && (e.code === 'RESTART_RATE_LIMIT' || e.code === 'AUTORIESGO_RATE_LIMIT'));
  if (transientRate) throw transientRate;

  if (isBoostrConfigured()) {
    const boostr = await lookupBoostrVehicle(clean);
    providerState.boostr = 'fallback-used';
    vehicle = mergeVehicle(vehicle, boostr);
    return { vehicle, source: 'Boostr fallback', providers: providerState };
  }

  const first = primaryErrors[0];
  if (first) throw first;
  const error = new Error('No encontré datos técnicos para esa patente.');
  error.code = 'NOT_FOUND'; error.status = 404; throw error;
}

async function lookupBoostrSupplement(plate) {
  const clean = cleanPlate(plate);
  if (!isBoostrConfigured()) {
    const error = new Error('Boostr no está configurado en Render.');
    error.code = 'BOOSTR_NOT_CONFIGURED'; error.status = 503; throw error;
  }
  const vehicle = await lookupBoostrVehicle(clean);
  return { vehicle, source: 'Boostr manual', providers: { boostr: 'manual-used' } };
}

module.exports = { lookupVehicleMulti, lookupBoostrSupplement, mergeVehicle, cleanPlate, isBoostrConfigured };
