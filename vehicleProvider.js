'use strict';

const { lookupVehicle: lookupBoostrVehicle } = require('./boostrProvider');
const {
  cleanPlate,
  lookupPrtVehicle,
  lookupSiiCandidates,
  enrichWithUnambiguousSii
} = require('./restartProvider');

function isBoostrConfigured() {
  return Boolean(String(process.env.BOOSTR_API_KEY || '').trim());
}

async function lookupVehicleMulti(plate) {
  const clean = cleanPlate(plate);
  let primaryError = null;
  try {
    let vehicle = await lookupPrtVehicle(clean);
    let siiMeta = { count: 0, exact: false };
    try {
      const candidates = await lookupSiiCandidates(vehicle);
      const enriched = enrichWithUnambiguousSii(vehicle, candidates);
      vehicle = enriched.vehicle;
      siiMeta = enriched.meta;
    } catch (error) {
      // PRT sigue siendo una respuesta válida aunque el cruce SII falle.
      siiMeta = { count: 0, exact: false, error: error.code || 'SII_UNAVAILABLE' };
    }
    return {
      vehicle,
      source: siiMeta.count ? 'PRT/reSTART + SII' : 'PRT/reSTART',
      providers: { primary: 'restart-prt', sii: siiMeta, boostr: 'not-used' }
    };
  } catch (error) {
    primaryError = error;
  }

  // Un 429 de reSTART suele durar segundos; no gastamos una consulta diaria de Boostr por eso.
  if (primaryError && primaryError.code === 'RESTART_RATE_LIMIT') throw primaryError;

  if (isBoostrConfigured()) {
    try {
      const vehicle = await lookupBoostrVehicle(clean);
      return {
        vehicle,
        source: 'Boostr fallback',
        providers: { primary: 'restart-prt', primaryError: primaryError && primaryError.code, boostr: 'fallback-used' }
      };
    } catch (fallbackError) {
      throw fallbackError;
    }
  }

  throw primaryError;
}

module.exports = { lookupVehicleMulti, cleanPlate, isBoostrConfigured };
