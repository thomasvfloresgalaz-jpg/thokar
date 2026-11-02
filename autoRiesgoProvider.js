'use strict';

const DEFAULT_BASE_URL = 'https://api.autoriesgo.cl';

function cleanText(value, max = 180) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanPlate(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function normalizeYear(value) {
  const raw = cleanText(value, 24);
  const match = raw.match(/\b(?:19|20)\d{2}\b/);
  return match ? match[0] : '';
}

function normalizeIdentifier(value, max = 70) {
  return cleanText(value, max).toUpperCase().replace(/\s+/g, '');
}

function normalizeFuel(value) {
  const raw = cleanText(value, 80);
  if (!raw) return '';
  const n = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/gasolina|bencina/.test(n)) return 'Gasolina';
  if (/diesel|petroleo/.test(n)) return 'Diésel';
  if (/hibrid/.test(n)) return 'Híbrido';
  if (/electric/.test(n)) return 'Eléctrico';
  if (/\bgas\b|glp|gnc/.test(n)) return 'Gas';
  return raw;
}

function getByPath(obj, path) {
  let cur = obj;
  for (const key of path.split('.')) {
    if (!cur || typeof cur !== 'object' || !Object.prototype.hasOwnProperty.call(cur, key)) return '';
    cur = cur[key];
  }
  return cur;
}

function firstValue(obj, paths) {
  for (const path of paths) {
    const value = getByPath(obj, path);
    if (value !== null && value !== undefined && value !== '') return value;
  }
  return '';
}

function mapAutoRiesgoVehicle(data, requestedPlate) {
  // Sólo se procesa vehicle_data. Nunca se copian campos raíz ni datos de propietario.
  const vehicle = {
    plate: cleanPlate(firstValue(data, ['plate', 'patente', 'ppu']) || requestedPlate),
    marca: cleanText(firstValue(data, ['make', 'brand', 'marca'])),
    modelo: cleanText(firstValue(data, ['model', 'modelo', 'line', 'linea'])),
    version: cleanText(firstValue(data, ['version', 'trim', 'vehicle_version'])),
    anio: normalizeYear(firstValue(data, ['year', 'anio', 'ano'])),
    tipo: cleanText(firstValue(data, ['type', 'vehicle_type', 'tipo'])),
    color: cleanText(firstValue(data, ['color'])),
    combustible: normalizeFuel(firstValue(data, ['fuel', 'fuel_type', 'gas_type', 'combustible'])),
    motor: normalizeIdentifier(firstValue(data, ['engine', 'engine_number', 'motor'])),
    chasis: normalizeIdentifier(firstValue(data, ['vin', 'chassis', 'chasis']), 80),
    kmRegistrado: cleanText(firstValue(data, ['mileage', 'kilometers', 'kilometres', 'kilometraje', 'odometer']), 50),
    fabricante: cleanText(firstValue(data, ['manufacturer', 'fabricante'])),
    procedencia: cleanText(firstValue(data, ['origin_country', 'country_origin', 'country', 'procedencia'])),
    cilindrada: cleanText(firstValue(data, ['engine_size', 'displacement', 'cilindrada']), 50),
    transmision: cleanText(firstValue(data, ['transmission', 'gearbox', 'transmision']), 80),
    puertas: cleanText(firstValue(data, ['doors', 'puertas']), 20),
    revisionTecnica: cleanText(firstValue(data, [
      'technical_review_status', 'revision_tecnica', 'prt.status', 'prt.status_label', 'prt.result',
      'technical_review.status', 'technical_review.result'
    ]), 120),
    mesRevision: cleanText(firstValue(data, ['prt.month', 'technical_review.month', 'revision_month']), 40)
  };

  return Object.fromEntries(Object.entries(vehicle).filter(([, value]) => value !== ''));
}

function errorFrom(message, code, status) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

function responseMessage(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const candidates = [payload.message, payload.error, payload.detail, payload.code, payload.status];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function lookupVehicle(plate) {
  const clean = cleanPlate(plate);
  if (!/^[A-Z0-9]{5,6}$/.test(clean)) {
    throw errorFrom('Patente inválida.', 'INVALID_PLATE', 400);
  }

  const base = String(process.env.AUTORIESGO_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = `${base}/api/v1/report/agent/lookup?patente=${encodeURIComponent(clean)}`;
  const timeoutMs = Math.max(3000, Math.min(30000, Number(process.env.AUTORIESGO_TIMEOUT_MS || 12000)));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let payload;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'user-agent': 'THOKAR-Taller/Prototipo-3'
      },
      signal: controller.signal
    });
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw errorFrom('AutoRiesgo tardó demasiado en responder.', 'AUTORIESGO_TIMEOUT', 504);
    }
    throw errorFrom('No fue posible conectar con AutoRiesgo.', 'AUTORIESGO_UNAVAILABLE', 502);
  } finally {
    clearTimeout(timer);
  }

  const msg = responseMessage(payload);

  if (response.status === 429) {
    throw errorFrom('AutoRiesgo limitó temporalmente las consultas. Espera un momento e intenta nuevamente.', 'AUTORIESGO_RATE_LIMIT', 429);
  }
  if (response.status === 404) {
    throw errorFrom('No encontré información para esa patente en AutoRiesgo.', 'NOT_FOUND', 404);
  }
  if (!response.ok) {
    throw errorFrom(msg ? `AutoRiesgo respondió: ${msg}` : `AutoRiesgo respondió HTTP ${response.status}.`, 'AUTORIESGO_HTTP_ERROR', 502);
  }

  // Formato documentado del endpoint agent/lookup:
  // { patente: "BCYT91", vehicle_data: { plate, make, model, year, ... }, purchase_full_report: {...} }
  // Se ignora explícitamente purchase_full_report y cualquier dato fuera de vehicle_data.
  const data = payload && payload.vehicle_data && typeof payload.vehicle_data === 'object' && !Array.isArray(payload.vehicle_data)
    ? payload.vehicle_data
    : null;

  if (!data) {
    if (/no\s+encontr|not\s+found|sin\s+informaci|no\s+existe/i.test(msg)) {
      throw errorFrom('No encontré información para esa patente en AutoRiesgo.', 'NOT_FOUND', 404);
    }
    throw errorFrom('AutoRiesgo respondió sin una ficha de vehículo reconocible.', 'AUTORIESGO_BAD_RESPONSE', 502);
  }

  const vehicle = mapAutoRiesgoVehicle(data, payload.patente || clean);
  const useful = ['marca', 'modelo', 'anio', 'tipo', 'motor', 'chasis', 'kmRegistrado', 'revisionTecnica'].some((key) => vehicle[key]);
  if (!useful) {
    throw errorFrom('AutoRiesgo no entregó datos técnicos reconocibles para esa patente.', 'NOT_FOUND', 404);
  }

  return vehicle;
}

module.exports = { lookupVehicle, mapAutoRiesgoVehicle, cleanPlate };
