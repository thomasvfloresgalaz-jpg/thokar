const ALLOWED_FIELDS = Object.freeze([
  'plate', 'tipo', 'marca', 'modelo', 'anio', 'color', 'motor', 'chasis',
  'combustible', 'procedencia', 'fabricante'
]);

const LABELS = [
  ['plate', /^(?:patente|ppu|placa(?:\s+patente)?)$/i],
  ['tipo', /^(?:tipo|tipo\s+de\s+veh[ií]culo|tipo\s+veh[ií]culo)$/i],
  ['marca', /^marca$/i],
  ['modelo', /^modelo$/i],
  ['anio', /^(?:a[nñ]o|a[nñ]o\s+de\s+fabricaci[oó]n)$/i],
  ['color', /^color$/i],
  ['motor', /^(?:n[.°ºo]*\s*(?:de\s+)?motor|nro\.?\s*(?:de\s+)?motor|n[uú]mero\s+(?:de\s+)?motor|motor)$/i],
  ['chasis', /^(?:n[.°ºo]*\s*(?:de\s+)?chasis|nro\.?\s*(?:de\s+)?chasis|n[uú]mero\s+(?:de\s+)?chasis|chasis|vin)$/i],
  ['combustible', /^(?:combustible|tipo\s+de\s+combustible)$/i],
  ['procedencia', /^procedencia$/i],
  ['fabricante', /^fabricante$/i]
];

const PRIVATE_LABEL = /(?:propietari|due[nñ]o|nombre\s+completo|\brut\b|\brun\b|direcci[oó]n|domicilio|tel[eé]fono|correo|e-?mail|fecha\s+de\s+nacimiento)/i;

function tidy(value, max = 120) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeLabel(value) {
  return tidy(value, 80)
    .replace(/[:：]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPlate(value) {
  return String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

function classifyLabel(label) {
  const normalized = normalizeLabel(label);
  if (!normalized || PRIVATE_LABEL.test(normalized)) return null;
  for (const [field, pattern] of LABELS) {
    if (pattern.test(normalized)) return field;
  }
  return null;
}

function normalizeValue(field, value) {
  let v = tidy(value, field === 'motor' || field === 'chasis' ? 64 : 120);
  if (!v || PRIVATE_LABEL.test(v) && field !== 'modelo') return '';
  if (field === 'plate') {
    const p = cleanPlate(v);
    return /^[A-Z0-9]{5,6}$/.test(p) ? p : '';
  }
  if (field === 'anio') {
    const m = v.match(/\b(?:19|20)\d{2}\b/);
    return m ? m[0] : '';
  }
  if (field === 'chasis') {
    v = v.toUpperCase().replace(/\s+/g, '');
    return /^[A-Z0-9-]{6,24}$/.test(v) ? v : '';
  }
  if (field === 'motor') {
    v = v.toUpperCase().replace(/\s+/g, '');
    return /^[A-Z0-9./-]{4,40}$/.test(v) ? v : '';
  }
  if (field === 'combustible') {
    const n = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    if (/gasolina|bencina/.test(n)) return 'Gasolina';
    if (/diesel|petroleo/.test(n)) return 'Diésel';
    if (/hibrid/.test(n)) return 'Híbrido';
    if (/electric/.test(n)) return 'Eléctrico';
    if (/\bgas\b|glp|gnc/.test(n)) return 'Gas';
  }
  return v;
}

function assignSafe(out, label, value) {
  const field = classifyLabel(label);
  if (!field || !ALLOWED_FIELDS.includes(field)) return;
  const clean = normalizeValue(field, value);
  if (clean && !out[field]) out[field] = clean;
}

function parseRows(rows = []) {
  const out = {};
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    assignSafe(out, row[0], row.slice(1).join(' '));
  }
  return out;
}

function parseVehicleText(text = '') {
  const out = {};
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => tidy(line, 240))
    .filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (PRIVATE_LABEL.test(line)) continue;

    const colon = line.match(/^(.{1,80}?)[\s]*[:：][\s]*(.+)$/);
    if (colon) {
      assignSafe(out, colon[1], colon[2]);
      continue;
    }

    const field = classifyLabel(line);
    if (field && i + 1 < lines.length && !classifyLabel(lines[i + 1]) && !PRIVATE_LABEL.test(lines[i + 1])) {
      const clean = normalizeValue(field, lines[i + 1]);
      if (clean && !out[field]) out[field] = clean;
      i += 1;
      continue;
    }

    for (const [candidateField, pattern] of LABELS) {
      const inline = line.match(new RegExp('^(' + pattern.source.replace(/^\^|\$$/g, '') + ')\\s+(.+)$', 'i'));
      if (inline) {
        const clean = normalizeValue(candidateField, inline[2]);
        if (clean && !out[candidateField]) out[candidateField] = clean;
        break;
      }
    }
  }
  return out;
}

function sanitizeVehicle(candidate = {}, requestedPlate = '') {
  const out = {};
  for (const field of ALLOWED_FIELDS) {
    const clean = normalizeValue(field, candidate[field]);
    if (clean) out[field] = clean;
  }
  const p = cleanPlate(requestedPlate);
  if (/^[A-Z0-9]{5,6}$/.test(p)) out.plate = p;
  return out;
}

function hasUsefulVehicleData(vehicle = {}) {
  return ['marca', 'modelo', 'anio', 'motor', 'chasis'].some((key) => Boolean(vehicle[key]));
}

module.exports = {
  ALLOWED_FIELDS,
  PRIVATE_LABEL,
  cleanPlate,
  classifyLabel,
  parseRows,
  parseVehicleText,
  sanitizeVehicle,
  hasUsefulVehicleData
};
