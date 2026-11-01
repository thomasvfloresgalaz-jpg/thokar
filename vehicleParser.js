const ALLOWED_FIELDS = Object.freeze([
  'plate', 'tipo', 'marca', 'modelo', 'anio', 'color', 'motor', 'chasis',
  'combustible', 'procedencia', 'fabricante', 'cilindrada', 'tipoSello',
  'multas', 'mesRevision', 'revisionTecnica', 'revisionGases', 'permisoCirculacion',
  'soap', 'kmRegistrado', 'transportePublico', 'tipoTransportePublico',
  'restriccion', 'siniestrado'
]);

const LABELS = [
  ['plate', /^(?:patente|ppu|placa(?:\s+patente)?|patente\s+veh[ií]culo)$/i],
  ['tipo', /^(?:tipo|tipo\s+de\s+veh[ií]culo|tipo\s+veh[ií]culo|clase\s+de\s+veh[ií]culo)$/i],
  ['marca', /^(?:marca|marca\s+veh[ií]culo)$/i],
  ['modelo', /^(?:modelo|modelo\s+veh[ií]culo)$/i],
  ['anio', /^(?:a[nñ]o|a[nñ]o\s+de\s+fabricaci[oó]n|a[nñ]o\s+veh[ií]culo)$/i],
  ['color', /^(?:color|color\s+veh[ií]culo|color\s+carrocer[ií]a)$/i],
  ['motor', /^(?:n[.°ºo]*\s*(?:de\s+)?motor|nro\.?\s*(?:de\s+)?motor|n[uú]mero\s+(?:de\s+)?motor|motor)$/i],
  ['chasis', /^(?:n[.°ºo]*\s*(?:de\s+)?chasis|nro\.?\s*(?:de\s+)?chasis|n[uú]mero\s+(?:de\s+)?chasis|chasis|vin|n[uú]mero\s+vin)$/i],
  ['combustible', /^(?:combustible|tipo\s+de\s+combustible)$/i],
  ['procedencia', /^(?:procedencia|pa[ií]s\s+de\s+procedencia)$/i],
  ['fabricante', /^(?:fabricante|fabricante\s+veh[ií]culo)$/i],
  ['cilindrada', /^(?:cilindrada|cilindrada\s+motor)$/i],
  ['tipoSello', /^(?:tipo\s+de\s+sello|tipo\s+sello|sello)$/i],
  ['multas', /^(?:multas|multas\s+de\s+tr[aá]nsito|cantidad\s+de\s+multas|n[.°ºo]*\s+de\s+multas)$/i],
  ['mesRevision', /^(?:mes\s+(?:de\s+)?revisi[oó]n(?:\s+t[eé]cnica)?|mes\s+prt)$/i],
  ['revisionTecnica', /^(?:revisi[oó]n\s+t[eé]cnica|estado\s+(?:de\s+)?revisi[oó]n\s+t[eé]cnica|prt)$/i],
  ['revisionGases', /^(?:revisi[oó]n\s+de\s+gases|estado\s+(?:de\s+)?revisi[oó]n\s+de\s+gases|gases)$/i],
  ['permisoCirculacion', /^(?:permiso\s+de\s+circulaci[oó]n|estado\s+(?:del\s+)?permiso\s+de\s+circulaci[oó]n)$/i],
  ['soap', /^(?:soap|seguro\s+obligatorio|seguro\s+obligatorio\s+soap|estado\s+soap)$/i],
  ['kmRegistrado', /^(?:kilometraje|kil[oó]metros|km|kilometraje\s+registrado|[uú]ltimo\s+kilometraje)$/i],
  ['transportePublico', /^(?:transporte\s+p[uú]blico|es\s+transporte\s+p[uú]blico)$/i],
  ['tipoTransportePublico', /^(?:tipo\s+de\s+transporte\s+p[uú]blico|tipo\s+transporte\s+p[uú]blico)$/i],
  ['restriccion', /^(?:restricci[oó]n\s+vehicular|restricci[oó]n|estado\s+restricci[oó]n)$/i],
  ['siniestrado', /^(?:siniestrado|veh[ií]culo\s+siniestrado|estado\s+siniestrado)$/i]
];

// No se recopilan ni devuelven datos de identidad/contacto del propietario.
const PRIVATE_LABEL = /(?:propietari|titular|due[nñ]o|nombre(?:\s+completo)?|apellido|\brut\b|\brun\b|direcci[oó]n|domicilio|tel[eé]fono|celular|correo|e-?mail|fecha\s+de\s+nacimiento|nacimiento)/i;

function tidy(value, max = 160) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function normalizeLabel(value) {
  return tidy(value, 100)
    .replace(/^[•·\-*–—\s]+/, '')
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
  let v = tidy(value, field === 'motor' || field === 'chasis' ? 80 : 180);
  if (!v) return '';
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
    return /^[A-Z0-9-]{6,30}$/.test(v) ? v : '';
  }
  if (field === 'motor') {
    v = v.toUpperCase().replace(/\s+/g, '');
    return /^[A-Z0-9./-]{3,50}$/.test(v) ? v : '';
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
  if (!field || !ALLOWED_FIELDS.includes(field)) return false;
  const clean = normalizeValue(field, value);
  if (clean && !out[field]) {
    out[field] = clean;
    return true;
  }
  return false;
}

function parseRows(rows = []) {
  const out = {};
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) continue;
    const label = row[0];
    if (PRIVATE_LABEL.test(normalizeLabel(label))) continue;
    assignSafe(out, label, row.slice(1).join(' '));
  }
  return out;
}

function parseVehicleText(text = '') {
  const out = {};
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => tidy(line, 260))
    .filter(Boolean);

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (PRIVATE_LABEL.test(normalizeLabel(line))) continue;

    const colon = line.match(/^(.{1,100}?)[\s]*[:：][\s]*(.+)$/);
    if (colon && assignSafe(out, colon[1], colon[2])) continue;

    const field = classifyLabel(line);
    if (field && i + 1 < lines.length) {
      const next = lines[i + 1];
      if (!classifyLabel(next) && !PRIVATE_LABEL.test(normalizeLabel(next))) {
        const clean = normalizeValue(field, next);
        if (clean && !out[field]) out[field] = clean;
        i += 1;
        continue;
      }
    }

    // Formato "Marca TOYOTA" / "Tipo de combustible Gasolina" sin dos puntos.
    // Probamos el prefijo más largo primero para no confundir "Tipo de combustible" con "Tipo".
    const words = line.split(/\s+/);
    for (let cut = words.length - 1; cut >= 1; cut -= 1) {
      const label = words.slice(0, cut).join(' ');
      const candidateField = classifyLabel(label);
      if (!candidateField) continue;
      const value = words.slice(cut).join(' ');
      const clean = normalizeValue(candidateField, value);
      if (clean && !out[candidateField]) out[candidateField] = clean;
      break;
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
  const core = ['marca', 'modelo', 'anio', 'motor', 'chasis'];
  const count = core.filter((key) => Boolean(vehicle[key])).length;
  return count >= 1 || Boolean(vehicle.tipo && (vehicle.fabricante || vehicle.procedencia));
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
