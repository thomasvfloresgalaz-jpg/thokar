/* THOKAR Taller - lógica pura (sin DOM). Se usa en la app y en las pruebas. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ThokarLib = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ---------- Utilidades ---------- */

  function normWord(w) {
    return String(w)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[º°.:;_,"'{}\[\]\-–—]/g, '');
  }

  function tidy(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }

  function cleanPlate(s) {
    return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  }

  function isPlateOk(p) {
    return /^[A-Z0-9]{5,6}$/.test(p || '');
  }

  /* ---------- Lectura de datos pegados ---------- */
  /* Solo se leen datos del VEHÍCULO. Cualquier dato del dueño se ignora. */

  const FIELD_LABELS = {
    patente: ['patente', 'ppu', 'placa patente', 'placa'],
    marca: ['marca'],
    modelo: ['modelo'],
    anio: ['ano', 'ano fabricacion', 'ano de fabricacion', 'ano vehiculo', 'ano del vehiculo'],
    motor: ['n motor', 'no motor', 'nro motor', 'nmotor', 'numero motor', 'numero de motor', 'n de motor', 'motor'],
    chasis: ['n chasis', 'no chasis', 'nro chasis', 'nchasis', 'numero chasis', 'numero de chasis', 'n de chasis', 'chasis'],
    vin: ['vin'],
    combustible: ['combustible', 'tipo combustible', 'tipo de combustible'],
    tipo: ['tipo', 'tipo vehiculo', 'tipo de vehiculo'],
    color: ['color'],
    procedencia: ['procedencia'],
    fabricante: ['fabricante']
  };

  const IGNORED_LABELS = [
    'propietario', 'dueno', 'nombre', 'rut', 'run', 'direccion', 'domicilio', 'telefono',
    'correo', 'email', 'comuna', 'pais', 'pais manufacturacion', 'pais de manufacturacion', 'multas',
    'transmision', 'cilindrada', 'carroceria', 'revision tecnica'
  ];

  const LOOKUP = {};
  Object.keys(FIELD_LABELS).forEach(function (field) {
    FIELD_LABELS[field].forEach(function (label) { LOOKUP[label] = { field: field, ignored: false }; });
  });
  IGNORED_LABELS.forEach(function (label) {
    if (!LOOKUP[label]) LOOKUP[label] = { field: label, ignored: true };
  });

  function classifyLine(line) {
    const items = line.split(/\s+/)
      .map(function (raw) { return { raw: raw, n: normWord(raw) }; })
      .filter(function (i) { return i.n !== ''; });
    for (let j = Math.min(4, items.length); j >= 1; j--) {
      const key = items.slice(0, j).map(function (i) { return i.n; }).join(' ');
      if (LOOKUP[key]) {
        return {
          field: LOOKUP[key].field,
          ignored: LOOKUP[key].ignored,
          value: items.slice(j).map(function (i) { return i.raw; }).join(' ').trim()
        };
      }
    }
    return null;
  }

  function fuelFrom(s) {
    const n = normWord(s);
    if (/gasolina|bencina/.test(n)) return 'Gasolina';
    if (/diesel|petroleo/.test(n)) return 'Diésel';
    if (/hibrid/.test(n)) return 'Híbrido';
    if (/electric/.test(n)) return 'Eléctrico';
    if (/\bgas\b|glp|gnc/.test(n)) return 'Gas';
    return '';
  }

  /* Si el texto pegado es JSON (en una o varias líneas), lo convierte a líneas "clave valor". */
  function flattenJson(text) {
    const t = String(text || '').trim();
    if (!/^[\[{]/.test(t)) return String(text || '');
    const out = [];
    const walk = function (o) {
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (o && typeof o === 'object') {
        Object.keys(o).forEach(function (k) {
          const v = o[k];
          if (v && typeof v === 'object') walk(v);
          else if (v !== null && v !== undefined) out.push(k + ' ' + v);
        });
      }
    };
    try { walk(JSON.parse(t)); return out.join('\n'); } catch (e) {
      return t.replace(/,\s*(?=")/g, '\n');
    }
  }

  function parsePasted(text) {
    const found = {};
    const lines = flattenJson(text)
      .split(/\r?\n/)
      .map(function (l) { return l.replace(/[{}\[\]",]/g, ' ').replace(/^([^:]{1,40}):/, '$1 ').trim(); })
      .filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const c = classifyLine(lines[i]);
      if (!c || c.ignored) continue;
      let value = c.value;
      if (!value) {
        const maxParts = c.field === 'modelo' ? 2 : 1;
        const parts = [];
        for (let k = i + 1; k < lines.length && parts.length < maxParts; k++) {
          if (classifyLine(lines[k])) break;
          parts.push(lines[k]);
        }
        value = parts.join(' ');
      }
      if (value && found[c.field] === undefined) found[c.field] = value;
    }

    const res = {};
    if (found.patente) {
      const p = cleanPlate(found.patente);
      if (isPlateOk(p)) res.plate = p;
    }
    if (found.marca) res.marca = tidy(found.marca);
    if (found.modelo) res.modelo = tidy(found.modelo);
    if (found.anio) {
      const m = String(found.anio).match(/\b(19|20)\d{2}\b/);
      if (m) res.anio = m[0];
    }
    if (found.motor) {
      const m = tidy(found.motor);
      const compact = m.replace(/\s+/g, '');
      if (compact.length >= 6 && /\d/.test(compact) && !/^\d\.\d/.test(m)) res.motor = m;
    }
    const chasisRaw = found.chasis || found.vin;
    if (chasisRaw) {
      const compact = String(chasisRaw).replace(/\s+/g, '').toUpperCase();
      if (/^[A-Z0-9]{8,20}$/.test(compact)) res.chasis = compact;
    }
    if (found.combustible) {
      const f = fuelFrom(found.combustible);
      if (f) res.combustible = f;
    }
    if (found.tipo) res.tipo = tidy(found.tipo);
    if (found.color) res.color = tidy(found.color);
    if (found.procedencia) res.procedencia = tidy(found.procedencia);
    if (found.fabricante) res.fabricante = tidy(found.fabricante);
    return res;
  }

  /* ---------- Respuesta JSON de la lectura de foto ---------- */

  function parseModelJson(text) {
    let t = String(text || '').trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    let obj;
    try { obj = JSON.parse(t); } catch (e) {
      const m = t.match(/\{[\s\S]*\}/);
      if (!m) return {};
      try { obj = JSON.parse(m[0]); } catch (e2) { return {}; }
    }
    if (Array.isArray(obj)) obj = obj[0] || {};
    const pick = function () {
      for (let i = 0; i < arguments.length; i++) {
        const v = obj[arguments[i]];
        if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
      }
      return '';
    };
    const res = {};
    const plate = cleanPlate(pick('patente', 'ppu', 'plate'));
    if (isPlateOk(plate)) res.plate = plate;
    const marca = pick('marca'); if (marca) res.marca = tidy(marca);
    const modelo = pick('modelo'); if (modelo) res.modelo = tidy(modelo);
    const anio = pick('anio', 'año', 'ano', 'year').match(/\b(19|20)\d{2}\b/);
    if (anio) res.anio = anio[0];
    const motor = pick('motor', 'n_motor', 'numero_motor'); if (motor) res.motor = tidy(motor);
    const chasis = pick('chasis', 'vin', 'n_chasis').replace(/\s+/g, '').toUpperCase();
    if (/^[A-Z0-9]{8,20}$/.test(chasis)) res.chasis = chasis;
    const comb = fuelFrom(pick('combustible')); if (comb) res.combustible = comb;
    return res;
  }

  /* ---------- Textos para la IA, catálogos y recordatorios ---------- */

  function vehicleLine(v) {
    const parts = [];
    const base = [v.marca, v.modelo, v.version].filter(Boolean).join(' ');
    if (base) parts.push(base);
    if (v.anio) parts.push('año ' + v.anio);
    if (v.combustible) parts.push('combustible: ' + v.combustible);
    if (v.motor) parts.push('n.° de motor: ' + v.motor);
    if (v.chasis) parts.push('VIN/chasis: ' + v.chasis);
    if (v.km) parts.push('kilometraje actual: ' + v.km + ' km');
    return parts.join('; ');
  }

  function buildSystemPrompt(v) {
    return [
      'Eres el asistente técnico de un mecánico automotriz que trabaja a domicilio en Chile (marca THOKAR). Hablas con el mecánico, que ya sabe lo básico: responde de colega a colega, en español de Chile, directo y práctico.',
      'Vehículo: ' + (vehicleLine(v) || 'no se indicó (consulta general; si hace falta, pregunta marca, modelo, año y motor)') + '.',
      'Sirves para cualquier consulta de mecánica: diagnóstico de fallas, procedimientos, repuestos y especificaciones, aceites y fluidos, sistema eléctrico, códigos OBD-II, reaprendizajes y adaptaciones tras desconectar la batería o cambiar piezas, torques, herramientas y cotización de trabajos.',
      'Reglas:',
      '1. Ante una falla: pregunta lo que falte (síntomas, cuándo ocurre, códigos de falla, qué se intervino), da las causas probables ordenadas de más a menos probable y de más fácil a más difícil de verificar, y explica cómo comprobar cada una (qué medir o inspeccionar y qué resultado esperar).',
      '2. Para repuestos y especificaciones da primero la especificación (viscosidad y norma, tipo de bujía, rosca, etc.) y después marcas o referencias.',
      '3. Nunca inventes números de parte, torques, capacidades, valores de medición ni procedimientos de un modelo específico. Si no estás seguro, dilo y marca el nivel de certeza (alta, media o baja).',
      '4. Si la respuesta depende del año, motor o versión, señala qué dato falta.',
      '5. Advierte los riesgos de seguridad relevantes (batería, airbags, combustible a presión, vehículo elevado, sistemas de alta tensión).',
      '6. Estructura las respuestas prácticas así cuando tenga sentido: "Resumen:" en 1-2 líneas; luego "Pasos:" con una lista numerada corta; termina con una línea "Verificar:" indicando dónde confirmar (manual de taller del fabricante, catálogo del repuesto, escáner).',
      '7. Evita párrafos largos. Prioriza pasos accionables, valores técnicos claramente identificados y advertencias breves. Si te envían una foto, descríbela primero en una línea y luego razona sobre lo que se ve, sin afirmar lo que no se distingue.'
    ].join('\n');
  }

  function searchLinks(v) {
    const base = [v.marca, v.modelo, v.anio].filter(Boolean).join(' ').trim();
    if (!base) return [];
    const mk = function (label, q) {
      return { label: label, url: 'https://www.google.com/search?q=' + encodeURIComponent(q) };
    };
    const detail = [base, v.version, v.motor].filter(Boolean).join(' ').trim();
    return [
      mk('Aceite y filtro', detail + ' aceite motor viscosidad capacidad filtro aceite equivalencias'),
      mk('Bujías', detail + ' bujías NGK Denso equivalencias'),
      mk('Pastillas delanteras', detail + ' pastillas freno delanteras medidas equivalencias'),
      mk('Filtro de aire', detail + ' filtro aire motor equivalencias'),
      mk('Filtro de cabina', detail + ' filtro polen cabina equivalencias'),
      mk('Correa / distribución', detail + ' correa distribución cadena distribución kit'),
      mk('Amortiguadores', detail + ' amortiguadores delanteros traseros equivalencias')
    ];
  }

  function formatKm(n) {
    const d = String(n || '').replace(/\D/g, '');
    return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  }

  function formatDate(iso) {
    if (!iso) return '';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sept','oct','nov','dic'];
    return Number(m[3]) + ' ' + months[Number(m[2]) - 1] + ' ' + m[1];
  }

  function reminderText(v, entry) {
    const car = [v.marca, v.modelo].filter(Boolean).join(' ') || 'vehículo';
    const plate = v.plate ? ' (' + v.plate + ')' : '';
    let s = 'Hola, te escribimos de THOKAR. Tu ' + car + plate + ' tuvo su último servicio (' + (entry.trabajo || 'mantención') + ')';
    if (entry.fecha) s += ' el ' + formatDate(entry.fecha);
    if (entry.km) s += ' a los ' + formatKm(entry.km) + ' km';
    s += '.';
    const next = [];
    if (entry.nextKm) next.push('a los ' + formatKm(entry.nextKm) + ' km');
    if (entry.nextFecha) next.push('hacia el ' + formatDate(entry.nextFecha));
    if (next.length) s += ' El próximo corresponde ' + next.join(' o ') + '.';
    s += ' ¿Quieres que coordinemos una visita a domicilio? WhatsApp +56 9 7304 6527 · Instagram @thokar.sa';
    return s;
  }

  /* ---------- Elegir modelos de Gemini ---------- */

  function rankModels(names) {
    const clean = [];
    (names || []).forEach(function (n) {
      const m = String(n).replace(/^models\//, '');
      if (clean.indexOf(m) < 0) clean.push(m);
    });
    const ver = function (n) { const m = n.match(/gemini-(\d+(?:\.\d+)?)/); return m ? parseFloat(m[1]) : 0; };
    const desc = function (a, b) { return ver(b) - ver(a); };
    const bad = /preview|exp|image|tts|live|audio|thinking|embed|vision|robotics|computer|deep-research|aqa|gemma/;
    const flash = clean.filter(function (n) { return /^gemini-[\d.]+-flash$/.test(n); }).sort(desc);
    const lite = clean.filter(function (n) { return /^gemini-[\d.]+-flash-lite$/.test(n); }).sort(desc);
    const other = clean.filter(function (n) {
      return /^gemini/.test(n) && !bad.test(n) && flash.indexOf(n) < 0 && lite.indexOf(n) < 0;
    }).sort(desc);
    return flash.concat(lite, other);
  }

  function pickBestModel(names) {
    return rankModels(names)[0] || '';
  }

  /* Respuesta del servicio de búsqueda por patente: solo se toman datos del vehículo. */
  function parseLookup(data) {
    const item = Array.isArray(data) ? data[0] : data;
    if (!item || typeof item !== 'object') return {};
    return parsePasted(JSON.stringify(item));
  }

  return {
    cleanPlate: cleanPlate,
    isPlateOk: isPlateOk,
    parsePasted: parsePasted,
    parseModelJson: parseModelJson,
    vehicleLine: vehicleLine,
    buildSystemPrompt: buildSystemPrompt,
    searchLinks: searchLinks,
    formatKm: formatKm,
    formatDate: formatDate,
    reminderText: reminderText,
    pickBestModel: pickBestModel,
    rankModels: rankModels,
    parseLookup: parseLookup
  };
});
