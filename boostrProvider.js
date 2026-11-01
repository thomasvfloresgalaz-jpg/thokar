'use strict';

const DEFAULT_BASE_URL = 'https://api.boostr.cl';

function cleanText(value, max = 180) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return '';
  return String(value).replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanPlate(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function firstValue(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (value !== null && value !== undefined && value !== '') return value;
    }
  }
  return '';
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

function normalizeYear(value) {
  const raw = cleanText(value, 20);
  const match = raw.match(/\b(?:19|20)\d{2}\b/);
  return match ? match[0] : '';
}

function normalizeIdentifier(value, max = 50) {
  return cleanText(value, max).toUpperCase().replace(/\s+/g, '');
}

function mapBoostrVehicle(data, requestedPlate) {
  // Lista explícita de campos técnicos. Nunca copiamos objetos como owner ni claves desconocidas.
  const vehicle = {
    plate: cleanPlate(firstValue(data, ['plate', 'patente', 'ppu']) || requestedPlate),
    dv: cleanText(firstValue(data, ['dv', 'check_digit', 'verification_digit']), 8),
    marca: cleanText(firstValue(data, ['make', 'brand', 'marca'])),
    modelo: cleanText(firstValue(data, ['model', 'modelo'])),
    anio: normalizeYear(firstValue(data, ['year', 'anio', 'ano'])),
    tipo: cleanText(firstValue(data, ['type', 'vehicle_type', 'tipo'])),
    motor: normalizeIdentifier(firstValue(data, ['engine', 'engine_number', 'motor'])),
    chasis: normalizeIdentifier(firstValue(data, ['chassis', 'vin', 'chasis']), 60),
    color: cleanText(firstValue(data, ['color'])),
    combustible: normalizeFuel(firstValue(data, ['gas_type', 'fuel_type', 'fuel', 'combustible'])),
    kmRegistrado: cleanText(firstValue(data, ['kilometers', 'kilometres', 'mileage', 'kilometraje']), 40),
    fabricante: cleanText(firstValue(data, ['manufacturer', 'fabricante'])),
    procedencia: cleanText(firstValue(data, ['country', 'origin_country', 'country_origin', 'procedencia', 'pais_procedencia'])),
    regionProcedencia: cleanText(firstValue(data, ['region', 'origin_region', 'region_origin', 'region_procedencia'])),
    puertas: cleanText(firstValue(data, ['doors', 'puertas']), 20),
    version: cleanText(firstValue(data, ['version', 'vehicle_version', 'trim'])),
    cilindrada: cleanText(firstValue(data, ['engine_size', 'displacement', 'cilindrada']), 40),
    transmision: cleanText(firstValue(data, ['transmission', 'gearbox', 'transmision']), 80),
    codigoSii: cleanText(firstValue(data, ['sii_code', 'siiCode', 'codigo_sii']), 60),
    tasacionFiscal: cleanText(firstValue(data, ['valuation', 'fiscal_valuation', 'tasacion', 'tasacion_fiscal']), 60)
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
  const candidates = [payload.message, payload.error, payload.data, payload.detail, payload.code];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function lookupVehicle(plate) {
  const apiKey = String(process.env.BOOSTR_API_KEY || '').trim();
  if (!apiKey) {
    throw errorFrom('Falta configurar BOOSTR_API_KEY en Render.', 'BOOSTR_NOT_CONFIGURED', 503);
  }

  const clean = cleanPlate(plate);
  if (!/^[A-Z0-9]{5,6}$/.test(clean)) {
    throw errorFrom('Patente inválida.', 'INVALID_PLATE', 400);
  }

  const base = String(process.env.BOOSTR_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  // No enviamos include=owner: THOKAR sólo solicita datos del vehículo.
  const url = `${base}/vehicle/${encodeURIComponent(clean)}.json`;
  const timeoutMs = Math.max(3000, Math.min(30000, Number(process.env.BOOSTR_TIMEOUT_MS || 12000)));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  let payload;
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-api-key': apiKey,
        'user-agent': 'THOKAR-Taller/4.0'
      },
      signal: controller.signal
    });
    payload = await response.json().catch(() => ({}));
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw errorFrom('Boostr tardó demasiado en responder.', 'BOOSTR_TIMEOUT', 504);
    }
    throw errorFrom('No fue posible conectar con Boostr API.', 'BOOSTR_UNAVAILABLE', 502);
  } finally {
    clearTimeout(timer);
  }

  const msg = responseMessage(payload);

  if (response.status === 401 || response.status === 403) {
    throw errorFrom('Boostr rechazó la API key. Revisa BOOSTR_API_KEY en Render.', 'BOOSTR_AUTH', 502);
  }
  if (response.status === 429) {
    throw errorFrom('Boostr aplicó su límite de consultas. Espera unos segundos e intenta nuevamente.', 'BOOSTR_RATE_LIMIT', 429);
  }
  if (!response.ok) {
    throw errorFrom(msg ? `Boostr respondió: ${msg}` : `Boostr respondió HTTP ${response.status}.`, 'BOOSTR_HTTP_ERROR', 502);
  }

  // Formato documentado: { status: "success", data: {...} }.
  if (payload && String(payload.status || '').toLowerCase() === 'error') {
    const text = msg || 'Boostr no pudo completar la consulta.';
    if (/no\s+encontr|not\s+found|sin\s+informaci|no\s+existe/i.test(text)) {
      throw errorFrom('No encontré información para esa patente en Boostr.', 'NOT_FOUND', 404);
    }
    if (/api\s*key|unauthor|forbidden|credencial|autentic/i.test(text)) {
      throw errorFrom('Boostr rechazó la API key. Revisa BOOSTR_API_KEY en Render.', 'BOOSTR_AUTH', 502);
    }
    if (/patente.*inv[aá]lid|invalid.*plate/i.test(text)) {
      throw errorFrom('La patente no tiene un formato válido.', 'INVALID_PLATE', 400);
    }
    throw errorFrom(text, 'BOOSTR_API_ERROR', 502);
  }

  const data = payload && payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : null;
  if (!data) {
    if (/no\s+encontr|not\s+found|sin\s+informaci|no\s+existe/i.test(msg)) {
      throw errorFrom('No encontré información para esa patente en Boostr.', 'NOT_FOUND', 404);
    }
    throw errorFrom('Boostr respondió sin una ficha de vehículo reconocible.', 'BOOSTR_BAD_RESPONSE', 502);
  }

  const vehicle = mapBoostrVehicle(data, clean);
  const useful = ['marca', 'modelo', 'anio', 'tipo', 'motor', 'chasis'].some((key) => vehicle[key]);
  if (!useful) {
    throw errorFrom('Boostr no entregó datos técnicos para esa patente.', 'NOT_FOUND', 404);
  }

  return vehicle;
}

module.exports = { lookupVehicle, mapBoostrVehicle, cleanPlate };
