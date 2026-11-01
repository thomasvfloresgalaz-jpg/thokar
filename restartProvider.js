'use strict';

const DEFAULT_BASE_URL = 'https://api.restart.cl/v1';
const siiCache = new Map();
const SII_CACHE_MS = 60 * 60 * 1000;

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

function normalizeYear(value) {
  const raw = cleanText(value, 32);
  const match = raw.match(/\b(?:19|20)\d{2}\b/);
  return match ? match[0] : '';
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

function normalizeIdentifier(value, max = 60) {
  return cleanText(value, max).toUpperCase().replace(/\s+/g, '');
}

function errorFrom(message, code, status, retryAfter = 0) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  if (retryAfter) err.retryAfter = retryAfter;
  return err;
}

function unwrapRecord(item) {
  if (!item || typeof item !== 'object') return {};
  if (item.attributes && typeof item.attributes === 'object') return item.attributes;
  return item;
}

function parseDateMs(value) {
  const ms = Date.parse(String(value || ''));
  return Number.isFinite(ms) ? ms : 0;
}

function mapPrtRecord(record, requestedPlate) {
  const a = unwrapRecord(record);
  const vehicle = {
    plate: cleanPlate(firstValue(a, ['ppu', 'plate', 'patente']) || requestedPlate),
    marca: cleanText(firstValue(a, ['marca', 'make', 'brand'])),
    modelo: cleanText(firstValue(a, ['modelo', 'model'])),
    anio: normalizeYear(firstValue(a, ['anio', 'ano', 'year', 'ano_vehiculo', 'anio_vehiculo', 'year_vehicle'])),
    tipo: cleanText(firstValue(a, ['tipo', 'tipo_vehiculo', 'categoria', 'category'])),
    motor: normalizeIdentifier(firstValue(a, ['motor', 'numero_motor', 'n_motor', 'engine', 'engine_number'])),
    chasis: normalizeIdentifier(firstValue(a, ['vin', 'chasis', 'numero_chasis', 'n_chasis', 'chassis'])),
    color: cleanText(firstValue(a, ['color'])),
    combustible: normalizeFuel(firstValue(a, ['combustible', 'fuel', 'tipo_combustible'])),
    kmRegistrado: cleanText(firstValue(a, ['kilometraje', 'km', 'mileage', 'odometro']), 40),
    fabricante: cleanText(firstValue(a, ['fabricante', 'manufacturer'])),
    procedencia: cleanText(firstValue(a, ['procedencia', 'pais_procedencia', 'country'])),
    version: cleanText(firstValue(a, ['version', 'versión', 'trim'])),
    cilindrada: cleanText(firstValue(a, ['cilindrada', 'engine_size', 'displacement']), 40),
    transmision: cleanText(firstValue(a, ['transmision', 'transmisión', 'transmission']), 80),
    revisionTecnica: cleanText(firstValue(a, ['fecha_revision', 'revision_fecha']), 40),
    revisionVencimiento: cleanText(firstValue(a, ['fecha_vencimiento', 'vencimiento']), 40),
    revisionResultado: cleanText(firstValue(a, ['resultado', 'result']), 30),
    prtSistema: cleanText(firstValue(a, ['sistema']), 40),
    prtCategoria: cleanText(firstValue(a, ['categoria']), 40)
  };
  return Object.fromEntries(Object.entries(vehicle).filter(([, value]) => value !== ''));
}

function mapSiiRecord(item) {
  const a = unwrapRecord(item);
  return Object.fromEntries(Object.entries({
    codigoSii: cleanText(firstValue(a, ['codigo_sii', 'codigoSii', 'code']), 60),
    marca: cleanText(firstValue(a, ['marca', 'make'])),
    modelo: cleanText(firstValue(a, ['modelo', 'model'])),
    version: cleanText(firstValue(a, ['version', 'versión', 'trim'])),
    anio: normalizeYear(firstValue(a, ['ano_vehiculo', 'anio_vehiculo', 'year', 'anio', 'ano'])),
    cilindrada: cleanText(firstValue(a, ['cilindrada', 'engine_size', 'displacement']), 40),
    combustible: normalizeFuel(firstValue(a, ['combustible', 'fuel'])),
    transmision: cleanText(firstValue(a, ['transmision', 'transmisión', 'transmission']), 80),
    tasacionFiscal: cleanText(firstValue(a, ['tasacion', 'tasacion_fiscal', 'valuation']), 60),
    permisoCirculacion: cleanText(firstValue(a, ['permiso', 'permiso_circulacion']), 60)
  }).filter(([, value]) => value !== ''));
}

async function restartFetch(pathname, query) {
  const base = String(process.env.RESTART_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
  const url = new URL(base + pathname);
  Object.entries(query || {}).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined) url.searchParams.set(k, String(v));
  });
  const apiKey = String(process.env.RESTART_API_KEY || '').trim();
  const timeoutMs = Math.max(3000, Math.min(30000, Number(process.env.RESTART_TIMEOUT_MS || 12000)));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const headers = { accept: 'application/json', 'user-agent': 'THOKAR-Taller/Prototipo-1' };
    if (apiKey) headers['x-api-key'] = apiKey;
    const response = await fetch(url, { method: 'GET', headers, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 429) {
      const retry = Math.max(1, Number(response.headers.get('retry-after') || 10));
      throw errorFrom('reSTART aplicó su límite temporal de consultas.', 'RESTART_RATE_LIMIT', 429, retry);
    }
    if (response.status === 404) throw errorFrom('No encontré información PRT para esa patente.', 'NOT_FOUND', 404);
    if (!response.ok) throw errorFrom(`reSTART respondió HTTP ${response.status}.`, 'RESTART_HTTP_ERROR', 502);
    return payload;
  } catch (error) {
    if (error && error.name === 'AbortError') throw errorFrom('PRT/reSTART tardó demasiado en responder.', 'RESTART_TIMEOUT', 504);
    if (error && error.code) throw error;
    throw errorFrom('No fue posible conectar con PRT/reSTART.', 'RESTART_UNAVAILABLE', 502);
  } finally {
    clearTimeout(timer);
  }
}

async function lookupPrtVehicle(plate) {
  const clean = cleanPlate(plate);
  if (!/^[A-Z0-9]{5,6}$/.test(clean)) throw errorFrom('Patente inválida.', 'INVALID_PLATE', 400);
  const payload = await restartFetch(`/vehiculos-revisiones/${encodeURIComponent(clean)}`);
  const rows = Array.isArray(payload && payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
  if (!rows.length) throw errorFrom('No encontré revisiones técnicas para esa patente.', 'NOT_FOUND', 404);
  const sorted = rows.slice().sort((a, b) => {
    const aa = unwrapRecord(a), bb = unwrapRecord(b);
    return parseDateMs(firstValue(bb, ['fecha_revision', 'revision_fecha'])) - parseDateMs(firstValue(aa, ['fecha_revision', 'revision_fecha']));
  });
  const latest = mapPrtRecord(sorted[0], clean);
  const useful = ['marca', 'modelo', 'anio', 'motor', 'chasis'].some((key) => latest[key]);
  if (!useful) throw errorFrom('PRT respondió sin una ficha utilizable para esa patente.', 'NOT_FOUND', 404);
  latest.prtHistorial = sorted.slice(0, 12).map((row) => {
    const a = unwrapRecord(row);
    return {
      fecha: cleanText(firstValue(a, ['fecha_revision', 'revision_fecha']), 40),
      vencimiento: cleanText(firstValue(a, ['fecha_vencimiento', 'vencimiento']), 40),
      resultado: cleanText(firstValue(a, ['resultado', 'result']), 30),
      sistema: cleanText(firstValue(a, ['sistema']), 30),
      categoria: cleanText(firstValue(a, ['categoria']), 30),
      km: cleanText(firstValue(a, ['kilometraje', 'km', 'mileage', 'odometro']), 30)
    };
  });
  return latest;
}

function normalizeForCompare(value) {
  return cleanText(value, 120).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
}

async function lookupSiiCandidates(vehicle) {
  if (!vehicle || !vehicle.marca || !vehicle.modelo) return [];
  const year = new Date().getFullYear();
  const cacheKey = [normalizeForCompare(vehicle.marca), normalizeForCompare(vehicle.modelo), year].join('|');
  const hit = siiCache.get(cacheKey);
  let mapped;
  if (hit && Date.now() - hit.at < SII_CACHE_MS) {
    mapped = hit.rows;
  } else {
    const payload = await restartFetch('/vehiculos-tasacion', {
      marca: vehicle.marca,
      modelo: vehicle.modelo,
      categoria: 'liviano',
      ano_tasacion: year
    });
    const rows = Array.isArray(payload && payload.data) ? payload.data : Array.isArray(payload) ? payload : [];
    mapped = rows.map(mapSiiRecord).filter((x) => x.marca || x.modelo || x.codigoSii);
    siiCache.set(cacheKey, { at: Date.now(), rows: mapped });
  }
  const wantedYear = String(vehicle.anio || '');
  const brand = normalizeForCompare(vehicle.marca);
  const model = normalizeForCompare(vehicle.modelo);
  const filtered = mapped.filter((x) => {
    const brandOk = !x.marca || normalizeForCompare(x.marca) === brand;
    const modelNorm = normalizeForCompare(x.modelo);
    const modelOk = !x.modelo || modelNorm === model || modelNorm.includes(model) || model.includes(modelNorm);
    const yearOk = !wantedYear || !x.anio || x.anio === wantedYear;
    return brandOk && modelOk && yearOk;
  });
  return filtered.slice(0, 20);
}

function enrichWithUnambiguousSii(vehicle, candidates) {
  const result = { ...vehicle };
  const meta = { count: candidates.length, exact: candidates.length === 1 };
  result.siiCoincidencias = candidates.slice(0, 8);
  // Regla conservadora: sólo promovemos datos SII a la ficha si quedó una única coincidencia.
  // Si hay varias versiones, se guardan como candidatos pero no se adivina cilindrada/versión.
  if (candidates.length !== 1) return { vehicle: result, meta };
  const only = candidates[0];
  const fields = ['codigoSii', 'version', 'cilindrada', 'combustible', 'transmision', 'tasacionFiscal', 'permisoCirculacion', 'anio'];
  for (const field of fields) if (!result[field] && only[field]) result[field] = only[field];
  return { vehicle: result, meta };
}

module.exports = {
  cleanPlate,
  mapPrtRecord,
  mapSiiRecord,
  lookupPrtVehicle,
  lookupSiiCandidates,
  enrichWithUnambiguousSii
};
