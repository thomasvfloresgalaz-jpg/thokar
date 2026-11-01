/* THOKAR Taller - interfaz y conexión con Gemini */
(function () {
  'use strict';
  var L = window.ThokarLib;
  var API = 'https://generativelanguage.googleapis.com/v1beta';
  var FALLBACK_MODEL = 'gemini-flash-latest';
  var K = { settings: 'thokar.settings', vehicles: 'thokar.vehicles', chats: 'thokar.chats', log: 'thokar.log', draft: 'thokar.draft' };

  /* ---------- Almacenamiento (con respaldo en memoria) ---------- */
  var storageOk = true;
  function load(k, def) {
    try { var s = localStorage.getItem(k); return s ? JSON.parse(s) : def; } catch (e) { storageOk = false; return def; }
  }
  function save(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { storageOk = false; }
  }
  function emptyVehicle() {
    return { plate: '', dv: '', tipo: '', marca: '', modelo: '', version: '', anio: '', color: '', combustible: '', motor: '', chasis: '', procedencia: '', regionProcedencia: '', fabricante: '', km: '', cilindrada: '', puertas: '', transmision: '', codigoSii: '', tasacionFiscal: '', tipoSello: '', multas: '', mesRevision: '', revisionTecnica: '', revisionGases: '', permisoCirculacion: '', soap: '', kmRegistrado: '', transportePublico: '', tipoTransportePublico: '', restriccion: '', siniestrado: '' };
  }
  var db = {
    settings: load(K.settings, { apiKey: '', model: '', auto: '' }),
    vehicles: load(K.vehicles, {}),
    chats: load(K.chats, {}),
    log: load(K.log, {})
  };
  var cur = Object.assign(emptyVehicle(), load(K.draft, {}));
  var tab = 'vehiculo';
  var busy = false;
  var pendingImage = '';
  var installEvent = null;

  function persist(which) {
    (which || ['settings', 'vehicles', 'chats', 'log']).forEach(function (n) { save(K[n], db[n]); });
  }
  function saveDraft() { save(K.draft, cur); }

  /* ---------- Utilidades ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function todayISO() {
    var d = new Date();
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  var toastTimer;
  function toast(msg) {
    var root = $('#toast-root');
    root.innerHTML = '<div class="toast" role="status">' + esc(msg) + '</div>';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { root.innerHTML = ''; }, 3800);
  }

  function md(text) {
    var out = [], inList = false;
    esc(text).split('\n').forEach(function (l) {
      var m = l.match(/^\s*[-*•]\s+(.*)$/);
      var inline = function (s) { return s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); };
      if (m) {
        if (!inList) { out.push('<ul>'); inList = true; }
        out.push('<li>' + inline(m[1]) + '</li>');
      } else {
        if (inList) { out.push('</ul>'); inList = false; }
        if (l.trim() !== '') out.push('<div>' + inline(l) + '</div>');
      }
    });
    if (inList) out.push('</ul>');
    return out.join('');
  }

  /* ---------- Hojas emergentes ---------- */
  function openSheet(html, mount) {
    var root = $('#sheet-root');
    root.innerHTML = '<div class="sheet-bg" data-sheet-bg><div class="sheet" role="dialog" aria-modal="true">' + html + '</div></div>';
    var bg = $('[data-sheet-bg]', root);
    bg.addEventListener('click', function (e) { if (e.target === bg) closeSheet(); });
    if (mount) mount($('.sheet', root));
    var first = $('.sheet textarea, .sheet input', root);
    if (first) first.focus();
  }
  function closeSheet() { $('#sheet-root').innerHTML = ''; }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /* ---------- Conexión con Gemini ---------- */
  function fail(msg, status) { var e = new Error(msg); e.handled = true; if (status) e.status = status; return e; }

  function friendlyError(status, body) {
    var raw = (body && body.error && body.error.message) || '';
    var st = (body && body.error && body.error.status) || '';
    var detail = raw ? ' Detalle de Google: ' + raw.slice(0, 220) : '';
    if (status === 400 && /API key|API_KEY/i.test(raw + st)) return 'Google dice que la clave no es válida. Cópiala de nuevo desde AI Studio.' + detail;
    if (status === 400) return 'Gemini no aceptó la consulta.' + detail;
    if (status === 401 || status === 403) return 'Google rechazó la clave o no tienes acceso. Revisa que sea una clave de AI Studio.' + detail;
    if (status === 404) return 'Ese modelo no está disponible para tu clave.' + detail;
    if (status === 429) return 'Llegaste al límite gratuito de este modelo. Espera un minuto o elige otro modelo en Ajustes.' + detail;
    if (status >= 500) return 'Gemini no está disponible en este momento. Intenta de nuevo en un rato.' + detail;
    return 'No se pudo completar la consulta (' + status + ').' + detail;
  }

  /* Pide a Gemini con la clave en el encabezado; si el navegador la bloquea, reintenta con la clave en la URL. */
  async function gfetch(path, key, init) {
    init = init || {};
    var headers = Object.assign({}, init.headers || {}, { 'x-goog-api-key': key });
    try {
      return await fetch(API + path, Object.assign({}, init, { headers: headers }));
    } catch (e1) {
      var sep = path.indexOf('?') >= 0 ? '&' : '?';
      try {
        return await fetch(API + path + sep + 'key=' + encodeURIComponent(key), Object.assign({}, init, { headers: init.headers || {} }));
      } catch (e2) {
        throw fail('La solicitud no llegó a Google. Revisa tu internet, desactiva VPN o bloqueadores de anuncios e intenta de nuevo.');
      }
    }
  }

  async function listModels(key) {
    var r = await gfetch('/models?pageSize=200', key);
    var j = await r.json().catch(function () { return {}; });
    if (!r.ok) throw fail(friendlyError(r.status, j), r.status);
    var names = (j.models || []).filter(function (m) {
      return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0;
    }).map(function (m) { return m.name; });
    return L.rankModels(names);
  }

  /* Prueba el modelo guardado y, si ese modelo falla (no existe, sin cupo gratuito o saturado), prueba los siguientes. */
  async function gemini(body) {
    var key = (db.settings.apiKey || '').trim();
    if (!key) throw fail('Falta la clave de Gemini. Pégala en Ajustes.');
    if (!navigator.onLine) throw fail('Sin internet. Conéctate para usar el asistente.');
    var manual = (db.settings.model || '').trim();
    var queue = manual ? [manual] : (db.settings.auto ? [db.settings.auto] : []);
    var tried = [], listed = false, lastErr = null;
    while (tried.length < 4) {
      if (!queue.length) {
        if (listed || manual) break;
        listed = true;
        try {
          (await listModels(key)).forEach(function (m) { if (tried.indexOf(m) < 0 && queue.indexOf(m) < 0) queue.push(m); });
        } catch (e) { lastErr = e; if (e.status === 400 || e.status === 401 || e.status === 403) throw e; }
        if (!queue.length && tried.indexOf(FALLBACK_MODEL) < 0) queue.push(FALLBACK_MODEL);
        if (!queue.length) break;
      }
      var model = queue.shift(); tried.push(model);
      var res = await gfetch('/models/' + encodeURIComponent(model) + ':generateContent', key, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      var j = await res.json().catch(function () { return {}; });
      if (res.ok) {
        var cand = j.candidates && j.candidates[0];
        var text = cand && cand.content && cand.content.parts
          ? cand.content.parts.map(function (p) { return p.text || ''; }).join('').trim() : '';
        if (!text) {
          var why = (j.promptFeedback && j.promptFeedback.blockReason) ? ' (' + j.promptFeedback.blockReason + ')' : '';
          throw fail('Gemini no devolvió respuesta' + why + '. Reformula la pregunta.');
        }
        if (!manual && db.settings.auto !== model) { db.settings.auto = model; persist(['settings']); }
        return text;
      }
      lastErr = fail(friendlyError(res.status, j), res.status);
      if (!manual && (res.status === 404 || res.status === 429 || res.status === 503)) {
        if (db.settings.auto === model) { db.settings.auto = ''; persist(['settings']); }
        continue;
      }
      break;
    }
    throw lastErr || fail('No se pudo conectar con Gemini.');
  }

  /* ---------- Búsqueda automática por patente (backend THOKAR) ---------- */
  function vehicleApiError(status, body) {
    var er = body && body.error ? body.error : {};
    var code = er.code || '';
    if (code === 'INVALID_PLATE' || status === 400) return 'La patente no tiene un formato válido.';
    if (code === 'NOT_FOUND' || status === 404) return 'No encontré información técnica para esa patente.';
    if (code === 'RATE_LIMIT' || status === 429) return 'Se hicieron demasiadas consultas. Espera un minuto e intenta otra vez.';
    if (code === 'BOOSTR_NOT_CONFIGURED') return 'Falta configurar BOOSTR_API_KEY en Render.';
    if (code === 'BOOSTR_AUTH') return 'Boostr rechazó la API key. Revisa BOOSTR_API_KEY en Render.';
    if (code === 'BOOSTR_RATE_LIMIT') return 'Boostr alcanzó su límite de consultas. Espera unos segundos e intenta otra vez.';
    if (code === 'BOOSTR_TIMEOUT' || status === 504) return 'Boostr tardó demasiado en responder. Intenta nuevamente.';
    if (code === 'BOOSTR_UNAVAILABLE') return 'No se pudo conectar con Boostr API. Intenta nuevamente.';
    if (code === 'BOOSTR_BAD_RESPONSE' || code === 'BOOSTR_API_ERROR' || code === 'BOOSTR_HTTP_ERROR') return er.message || 'Boostr devolvió una respuesta que THOKAR no pudo procesar.';
    if (er.message) return er.message;
    if (status >= 500) return 'El servidor de THOKAR no pudo completar la consulta de patente.';
    return 'No se pudo consultar la patente (' + status + ').';
  }

  function lookupStatus(message, isError) {
    var out = $('#lookup-status');
    if (!out) return;
    out.textContent = message || '';
    out.style.color = isError ? 'var(--red)' : '';
  }

  async function lookupPlate() {
    if (busy) return;
    if (!L.isPlateOk(cur.plate)) { toast('Escribe la patente primero.'); return; }
    if (!navigator.onLine) { toast('Sin internet.'); return; }
    var btn = $('#btn-lookup');
    busy = true;
    lookupStatus('Consultando la ficha técnica…', false);
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Buscando…'; }
    var ctl = new AbortController();
    var timer = setTimeout(function () { ctl.abort(); }, 60000);
    try {
      var res = await fetch('/api/vehiculo/' + encodeURIComponent(cur.plate), {
        method: 'GET', headers: { 'Accept': 'application/json' }, cache: 'no-store', signal: ctl.signal
      });
      var body = await res.json().catch(function () { return {}; });
      if (!res.ok || !body.ok) throw fail(vehicleApiError(res.status, body), res.status);
      var found = body.vehicle || {};
      var got = Object.keys(found).filter(function (k) { return k !== 'plate' && found[k]; });
      if (!got.length) throw fail('La fuente respondió, pero no entregó campos técnicos reconocibles.');
      delete found.plate;
      var labels = applyFound(found);
      lookupStatus('Datos técnicos encontrados en ' + (body.source || 'la fuente') + ': ' + labels.join(', ') + '. Verifícalos con la documentación del vehículo.', false);
      toast('Datos técnicos cargados.');
    } catch (e) {
      var msg = e.handled ? e.message : (e.name === 'AbortError'
        ? 'La consulta superó el tiempo máximo. Intenta nuevamente.'
        : 'No pude comunicarme con el backend de THOKAR. Revisa que esta versión esté desplegada como aplicación Node, no como sitio estático.');
      lookupStatus(msg, true);
      toast(msg);
    } finally {
      clearTimeout(timer);
      busy = false;
      var b2 = $('#btn-lookup');
      if (b2) { b2.disabled = false; b2.innerHTML = 'Buscar datos por patente'; }
    }
  }

  /* ---------- Vehículo ---------- */
  function chatKey() { return cur.plate || '_sin_patente'; }
  function vehicleName() {
    return [cur.marca, cur.modelo, cur.version].filter(Boolean).join(' ');
  }

  function applyFound(found, source) {
    var labels = { plate: 'patente', dv: 'dígito verificador', tipo: 'tipo', marca: 'marca', modelo: 'modelo', version: 'versión', anio: 'año', color: 'color', motor: 'motor', chasis: 'chasis/VIN', combustible: 'combustible', procedencia: 'país de procedencia', regionProcedencia: 'región de procedencia', fabricante: 'fabricante', cilindrada: 'cilindrada', puertas: 'puertas', transmision: 'transmisión', codigoSii: 'código SII', tasacionFiscal: 'tasación fiscal', tipoSello: 'tipo de sello', multas: 'multas', mesRevision: 'mes de revisión', revisionTecnica: 'revisión técnica', revisionGases: 'revisión de gases', permisoCirculacion: 'permiso de circulación', soap: 'SOAP', kmRegistrado: 'kilometraje registrado', transportePublico: 'transporte público', tipoTransportePublico: 'tipo de transporte público', restriccion: 'restricción vehicular', siniestrado: 'siniestrado' };
    var got = [];
    Object.keys(found).forEach(function (k) {
      if (found[k]) { cur[k] = found[k]; got.push(labels[k] || k); }
    });
    saveDraft();
    fillForm();
    return got;
  }

  function fillForm() {
    ['plate', 'tipo', 'marca', 'modelo', 'version', 'anio', 'color', 'combustible', 'motor', 'chasis', 'procedencia', 'fabricante', 'km'].forEach(function (f) {
      var el = $('#f-' + f);
      if (el) el.value = f === 'km' ? L.formatKm(cur.km) : (cur[f] || '');
    });
  }

  function onField(e) {
    var el = e.target;
    if (!el.id || el.id.indexOf('f-') !== 0) return;
    var f = el.id.slice(2);
    if (f === 'plate') {
      cur.plate = L.cleanPlate(el.value);
      el.value = cur.plate;
      var saved = db.vehicles[cur.plate];
      if (saved && !cur.marca && !cur.modelo) { cur = Object.assign(emptyVehicle(), saved); fillForm(); toast('Vehículo cargado desde guardados.'); }
    } else if (f === 'km') {
      cur.km = String(el.value).replace(/\D/g, '').slice(0, 7);
      el.value = L.formatKm(cur.km);
    } else {
      cur[f] = el.value;
    }
    saveDraft();
  }

  function saveVehicle() {
    if (!L.isPlateOk(cur.plate)) { toast('Escribe la patente (5 o 6 caracteres) para guardar.'); return; }
    if (!cur.marca && !cur.modelo) { toast('Completa al menos marca y modelo.'); return; }
    db.vehicles[cur.plate] = Object.assign({}, cur);
    persist(['vehicles']);
    toast('Vehículo guardado.');
    render();
  }

  function loadVehicle(plate) {
    if (!db.vehicles[plate]) return;
    cur = Object.assign(emptyVehicle(), db.vehicles[plate]);
    saveDraft();
    render();
    window.scrollTo(0, 0);
  }

  function deleteVehicle(plate) {
    openSheet(
      '<h3>¿Borrar ' + esc(plate) + '?</h3><p class="muted">Se borra el vehículo guardado, su chat y su libreta de mantención. No se puede deshacer.</p>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn" data-sheet-close>Cancelar</button><button class="btn danger" id="confirm-del">Borrar</button></div>',
      function (s) {
        $('[data-sheet-close]', s).addEventListener('click', closeSheet);
        $('#confirm-del', s).addEventListener('click', function () {
          delete db.vehicles[plate]; delete db.chats[plate]; delete db.log[plate];
          persist(); closeSheet(); render();
        });
      });
  }

  function openPaste() {
    openSheet(
      '<h3>Pegar datos de la patente</h3>' +
      '<p class="muted small">Abre el buscador que usas, copia el resultado completo y pégalo aquí. La app toma datos del vehículo y antecedentes administrativos útiles (marca, modelo, año, motor, chasis, revisión, SOAP, multas y similares). Los datos personales del propietario se ignoran y no se guardan.</p>' +
            '<div class="field"><label for="paste-text">Texto copiado</label><textarea id="paste-text" placeholder="Pega aquí"></textarea></div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" data-sheet-close>Cancelar</button><button class="btn primary" id="do-paste">Leer datos</button></div>',
      function (s) {
        $('[data-sheet-close]', s).addEventListener('click', closeSheet);
        $('#do-paste', s).addEventListener('click', function () {
          var found = L.parsePasted($('#paste-text', s).value);
          var got = applyFound(found);
          closeSheet();
          toast(got.length ? 'Datos leídos: ' + got.join(', ') + '. Verifícalos antes de comprar repuestos.' : 'No encontré datos del vehículo en ese texto.');
        });
      });
  }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, max / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85).split(',')[1]);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('No pude abrir esa imagen.')); };
      img.src = url;
    });
  }

  async function readPhoto(file) {
    if (!file) return;
    var btn = $('#btn-photo');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Leyendo…'; }
    try {
      var b64 = await loadImage(file);
      var prompt = 'La imagen es un permiso de circulación, padrón o certificado de un vehículo de Chile. ' +
        'Extrae SOLO datos del vehículo, nunca del propietario. Responde únicamente un JSON con estas claves: ' +
        'patente, marca, modelo, anio, motor, chasis, combustible. Usa "" si un dato no se ve con claridad. ' +
        'Copia patente, motor y chasis carácter por carácter, sin adivinar.';
      var text = await gemini({
        contents: [{ role: 'user', parts: [{ inline_data: { mime_type: 'image/jpeg', data: b64 } }, { text: prompt }] }],
        generationConfig: { temperature: 0, responseMimeType: 'application/json' }
      });
      var got = applyFound(L.parseModelJson(text));
      toast(got.length ? 'Leí: ' + got.join(', ') + '. Compara motor y chasis con el papel.' : 'No pude leer datos en esa foto. Prueba con más luz.');
    } catch (e) {
      toast(e.handled ? e.message : (e.message || 'No se pudo leer la foto.'));
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = 'Foto del permiso'; }
    }
  }

  /* ---------- Asistente ---------- */
  var QUICK = [
    ['Aceite y filtro', 'Qué aceite (viscosidad y norma), cuántos litros aproximados y qué filtro de aceite lleva este vehículo.'],
    ['Bujías', 'Qué bujías lleva este vehículo (tipo, rosca, gap si lo sabes) y cada cuánto se cambian.'],
    ['Pastillas delanteras', 'Qué pastillas de freno delanteras lleva este vehículo y qué marcas de repuesto sirven.'],
    ['Refrigerante', 'Qué refrigerante (tipo y especificación) y qué capacidad aproximada del circuito tiene este vehículo.'],
    ['Correa o cadena', 'Este motor usa correa o cadena de distribución, y cada cuánto se revisa o se cambia.'],
    ['Ralentí inestable', 'Este vehículo tiene el ralentí inestable o bajo. Hazme las preguntas que necesites y dame las causas probables con cómo comprobar cada una.'],
    ['Tras desconectar batería', 'Se desconectó la batería o se cambió el alternador y ahora el motor anda raro. Qué reaprendizajes o adaptaciones necesita este vehículo y qué más conviene revisar.'],
    ['Códigos de falla', 'Voy a darte códigos de falla OBD-II de este vehículo. Dime qué datos necesitas y cómo interpretarlos.']
  ];

  function loadChatImage(file) {
    return loadImage(file);
  }

  async function ask(text) {
    text = String(text || '').trim();
    if (busy) return;
    if (!text && !pendingImage) return;
    if (!text) text = 'Mira esta foto y dime qué ves y qué podría ser.';
    if (!(db.settings.apiKey || '').trim()) { toast('Primero pega tu clave de Gemini en Ajustes.'); setTab('ajustes'); return; }
    var key = chatKey();
    var th = db.chats[key] = db.chats[key] || [];
    var image = pendingImage; pendingImage = '';
    th.push({ role: 'user', text: text + (image ? '  [foto adjunta]' : '') });
    busy = true; render(); scrollChatEnd();
    try {
      var recent = th.slice(-12).filter(function (m) { return !m.error; });
      var contents = recent.map(function (m) { return { role: m.role, parts: [{ text: m.text }] }; });
      if (image) contents[contents.length - 1].parts.unshift({ inline_data: { mime_type: 'image/jpeg', data: image } });
      var reply = await gemini({
        systemInstruction: { parts: [{ text: L.buildSystemPrompt(cur) }] },
        contents: contents,
        generationConfig: { temperature: 0.3 }
      });
      th.push({ role: 'model', text: reply });
    } catch (e) {
      th.push({ role: 'model', text: e.message || 'Error inesperado.', error: true });
    }
    if (th.length > 40) db.chats[key] = th.slice(-40);
    busy = false; persist(['chats']); render(); scrollChatEnd();
  }
  function scrollChatEnd() {
    var box = $('#chat-thread');
    if (!box) return;
    requestAnimationFrame(function () { box.scrollTop = box.scrollHeight; });
  }

  /* ---------- Libreta ---------- */
  function openEntry() {
    if (!L.isPlateOk(cur.plate)) { toast('Escribe y guarda la patente primero.'); setTab('vehiculo'); return; }
    var jobs = ['Cambio de aceite y filtro', 'Pastillas de freno', 'Refrigerante', 'Bujías', 'Diagnóstico con escáner', 'Filtro de aire', 'Otro trabajo'];
    openSheet(
      '<h3>Nuevo trabajo en ' + esc(cur.plate) + '</h3>' +
      '<div class="grid2 field">' +
      '<div><label for="e-fecha">Fecha</label><input id="e-fecha" type="date" value="' + todayISO() + '"></div>' +
      '<div><label for="e-km">Kilometraje</label><input id="e-km" inputmode="numeric" value="' + esc(L.formatKm(cur.km)) + '"></div>' +
      '<div class="span2"><label for="e-trabajo">Trabajo</label><input id="e-trabajo" list="jobs" placeholder="Ej. Cambio de aceite y filtro"><datalist id="jobs">' +
      jobs.map(function (j) { return '<option value="' + esc(j) + '">'; }).join('') + '</datalist></div>' +
      '<div class="span2"><label for="e-notas">Repuestos y aceite usados</label><textarea id="e-notas" placeholder="Ej. 5W-30 sintético, 4 L, filtro marca X"></textarea></div>' +
      '<div><label for="e-nkm">Próximo cambio (km)</label><input id="e-nkm" inputmode="numeric"></div>' +
      '<div><label for="e-nfecha">Próximo (fecha)</label><input id="e-nfecha" type="date"></div>' +
      '</div>' +
      '<div class="btn-row" style="margin-top:16px"><button class="btn" data-sheet-close>Cancelar</button><button class="btn primary" id="e-save">Guardar</button></div>',
      function (s) {
        ['#e-km', '#e-nkm'].forEach(function (id) {
          $(id, s).addEventListener('input', function (e) { e.target.value = L.formatKm(e.target.value); });
        });
        $('[data-sheet-close]', s).addEventListener('click', closeSheet);
        $('#e-save', s).addEventListener('click', function () {
          var trabajo = $('#e-trabajo', s).value.trim();
          if (!trabajo) { toast('Escribe qué trabajo hiciste.'); return; }
          var entry = {
            id: uid(),
            fecha: $('#e-fecha', s).value,
            km: $('#e-km', s).value.replace(/\D/g, ''),
            trabajo: trabajo,
            notas: $('#e-notas', s).value.trim(),
            nextKm: $('#e-nkm', s).value.replace(/\D/g, ''),
            nextFecha: $('#e-nfecha', s).value
          };
          var list = db.log[cur.plate] = db.log[cur.plate] || [];
          list.unshift(entry);
          list.sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
          if (entry.km && !cur.km) { cur.km = entry.km; saveDraft(); }
          if (!db.vehicles[cur.plate] && (cur.marca || cur.modelo)) db.vehicles[cur.plate] = Object.assign({}, cur);
          persist(['log', 'vehicles']);
          closeSheet(); toast('Trabajo guardado.'); render();
        });
      });
  }

  function openReminder(id) {
    var entry = (db.log[cur.plate] || []).filter(function (e) { return e.id === id; })[0];
    if (!entry) return;
    var text = L.reminderText(cur, entry);
    openSheet(
      '<h3>Recordatorio para el cliente</h3>' +
      '<div class="field"><label for="r-text">Mensaje (puedes editarlo)</label><textarea id="r-text" style="min-height:150px">' + esc(text) + '</textarea></div>' +
      '<div class="btn-row" style="margin-top:14px"><button class="btn" id="r-copy">Copiar</button><a class="btn primary" id="r-wa" target="_blank" rel="noopener" style="text-decoration:none;display:flex;align-items:center;justify-content:center">Abrir WhatsApp</a></div>' +
      '<button class="link-btn" data-sheet-close>Cerrar</button>',
      function (s) {
        var ta = $('#r-text', s), wa = $('#r-wa', s);
        var upd = function () { wa.href = 'https://wa.me/?text=' + encodeURIComponent(ta.value); };
        upd(); ta.addEventListener('input', upd);
        $('[data-sheet-close]', s).addEventListener('click', closeSheet);
        $('#r-copy', s).addEventListener('click', function () {
          ta.select();
          var done = function () { toast('Mensaje copiado.'); };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { document.execCommand('copy'); done(); });
          else { document.execCommand('copy'); done(); }
        });
      });
  }

  function deleteEntry(id) {
    db.log[cur.plate] = (db.log[cur.plate] || []).filter(function (e) { return e.id !== id; });
    persist(['log']); render();
  }

  /* ---------- Ajustes ---------- */
  function exportBackup() {
    var data = { app: 'thokar-taller', version: 1, fecha: new Date().toISOString(), vehicles: db.vehicles, log: db.log, chats: db.chats };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'thokar-respaldo-' + todayISO() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    toast('Respaldo descargado. La clave de Gemini no se incluye.');
  }

  function importBackup(file) {
    if (!file) return;
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var d = JSON.parse(fr.result);
        if (d.app !== 'thokar-taller') throw new Error('x');
        Object.assign(db.vehicles, d.vehicles || {});
        Object.keys(d.log || {}).forEach(function (p) {
          var have = {}; (db.log[p] || []).forEach(function (e) { have[e.id] = true; });
          db.log[p] = (db.log[p] || []).concat((d.log[p] || []).filter(function (e) { return !have[e.id]; }));
        });
        Object.assign(db.chats, d.chats || {});
        persist(); toast('Respaldo importado.'); render();
      } catch (e) { toast('Ese archivo no es un respaldo de THOKAR Taller.'); }
    };
    fr.readAsText(file);
  }

  async function testConnection() {
    var out = $('#test-out');
    var key = (db.settings.apiKey || '').trim();
    if (!key) { out.textContent = 'Primero pega la clave.'; return; }
    out.innerHTML = '<span class="spinner"></span> Probando…';
    var lines = ['Clave: ' + key.length + ' caracteres (debería empezar con AIza y tener unos 39).'];
    try {
      var models = await listModels(key);
      lines.push('Lista de modelos: ' + models.length + ' disponibles' + (models.length ? ' (' + models.slice(0, 3).join(', ') + ')' : '') + '.');
    } catch (e) { lines.push('Lista de modelos: ' + e.message); }
    try {
      var t = await gemini({ contents: [{ role: 'user', parts: [{ text: 'Responde solo con la palabra OK.' }] }], generationConfig: { temperature: 0 } });
      lines.push('<strong style="color:var(--ok)">Conectado.</strong> Modelo usado: ' + (db.settings.model || db.settings.auto || FALLBACK_MODEL) + '. Respuesta: ' + t.slice(0, 40));
    } catch (e) { lines.push('<strong style="color:var(--red)">Falló:</strong> ' + e.message); }
    out.innerHTML = lines.map(function (l) { return '<div style="margin-top:6px">' + (l.indexOf('<strong') === 0 ? l : esc(l)) + '</div>'; }).join('');
  }

  async function doDetect() {
    var out = $('#test-out');
    var key = (db.settings.apiKey || '').trim();
    if (!key) { out.textContent = 'Primero pega la clave.'; return; }
    out.innerHTML = '<span class="spinner"></span> Buscando modelo…';
    try {
      var list = await listModels(key);
      if (!list.length) { out.textContent = 'No encontré un modelo compatible. Escríbelo a mano.'; return; }
      db.settings.auto = list[0]; db.settings.model = ''; persist(['settings']);
      var inp = $('#s-model'); if (inp) inp.value = '';
      out.textContent = 'Modelo en uso: ' + list[0] + '. Otros disponibles: ' + list.slice(1, 4).join(', ') + '.';
    } catch (e) { out.innerHTML = '<span style="color:var(--red)">' + esc(e.message) + '</span>'; }
  }

  /* ---------- Pantallas ---------- */
  var ICONS = {
    vehiculo: '<svg viewBox="0 0 24 24"><path d="M5 16V11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11v5"/><path d="M3.5 16h17v2.5h-3V17H6.5v1.5h-3z"/><circle cx="7.5" cy="13" r=".6"/><circle cx="16.5" cy="13" r=".6"/></svg>',
    asistente: '<svg viewBox="0 0 24 24"><path d="M4 5.5h16v10H10l-4.5 3.5v-3.5H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>',
    libreta: '<svg viewBox="0 0 24 24"><path d="M6 3.5h11a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6z"/><path d="M6 3.5v17M9.5 8h5.5M9.5 11.5h5.5"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>'
  };
  var TABS = [['vehiculo', 'Vehículo'], ['asistente', 'Asistente'], ['libreta', 'Libreta'], ['ajustes', 'Ajustes']];

  function setTab(t) { tab = t; render(); window.scrollTo(0, 0); }

  function renderTabs() {
    $('#tabs').innerHTML = '<div class="tabs-inner">' + TABS.map(function (t) {
      return '<button class="tab" data-tab="' + t[0] + '"' + (tab === t[0] ? ' aria-current="page"' : '') + '>' + ICONS[t[0]] + '<span>' + t[1] + '</span></button>';
    }).join('') + '</div>';
  }

  function vehicleView() {
    var savedPlates = Object.keys(db.vehicles).sort();
    var extraLabels = {
      dv: 'Dígito verificador', cilindrada: 'Cilindrada', puertas: 'Puertas', transmision: 'Transmisión', codigoSii: 'Código SII', tasacionFiscal: 'Tasación fiscal', regionProcedencia: 'Región de procedencia', tipoSello: 'Tipo de sello', multas: 'Multas de tránsito',
      mesRevision: 'Mes de revisión técnica', revisionTecnica: 'Revisión técnica', revisionGases: 'Revisión de gases',
      permisoCirculacion: 'Permiso de circulación', soap: 'SOAP', kmRegistrado: 'Kilometraje registrado',
      transportePublico: 'Transporte público', tipoTransportePublico: 'Tipo de transporte público',
      restriccion: 'Restricción vehicular', siniestrado: 'Siniestrado'
    };
    var extraHtml = Object.keys(extraLabels).filter(function (k) { return cur[k]; }).map(function (k) {
      return '<div><span class="muted small">' + esc(extraLabels[k]) + '</span><div>' + esc(cur[k]) + '</div></div>';
    }).join('');
    return '' +
      '<div class="plate-block"><label class="plate-label" for="f-plate">Patente</label>' +
      '<div class="plate"><input id="f-plate" inputmode="text" autocapitalize="characters" autocomplete="off" spellcheck="false" maxlength="12" placeholder="ABCD12" value="' + esc(cur.plate) + '"></div></div>' +
      '<button class="btn primary block" id="btn-lookup">Buscar datos por patente</button>' +
      '<p class="muted small" id="lookup-status" style="margin:8px 0 0" aria-live="polite"></p>' +
      '<div class="btn-row" style="margin-top:10px">' +
      '<button class="btn" id="btn-paste">Pegar datos</button>' +
      '<button class="btn" id="btn-photo">Foto del permiso</button></div>' +
      '<input type="file" id="photo-input" accept="image/*" hidden>' +
      '<p class="muted small" style="margin:8px 0 16px">Los datos leídos pueden fallar: compáralos con el papel del vehículo antes de pedir repuestos.</p>' +
      '<div class="card"><div class="grid2 field">' +
      '<div><label for="f-marca">Marca</label><input id="f-marca" autocomplete="off" value="' + esc(cur.marca) + '"></div>' +
      '<div><label for="f-anio">Año</label><input id="f-anio" inputmode="numeric" maxlength="4" value="' + esc(cur.anio) + '"></div>' +
      '<div class="span2"><label for="f-modelo">Modelo</label><input id="f-modelo" autocomplete="off" value="' + esc(cur.modelo) + '"></div>' +
      '<div><label for="f-tipo">Tipo</label><input id="f-tipo" autocomplete="off" value="' + esc(cur.tipo) + '"></div>' +
      '<div><label for="f-color">Color</label><input id="f-color" autocomplete="off" value="' + esc(cur.color) + '"></div>' +
      '<div class="span2"><label for="f-version">Versión o motor (ej. 1.6 AT, 2.0 Turbo)</label><input id="f-version" autocomplete="off" value="' + esc(cur.version) + '"></div>' +
      '<div><label for="f-combustible">Combustible</label><select id="f-combustible">' +
      ['', 'Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas'].map(function (o) { return '<option value="' + o + '"' + (cur.combustible === o ? ' selected' : '') + '>' + (o || 'Sin indicar') + '</option>'; }).join('') + '</select></div>' +
      '<div><label for="f-km">Kilometraje (tablero)</label><input id="f-km" inputmode="numeric" value="' + esc(L.formatKm(cur.km)) + '"></div>' +
      '<div class="span2"><label for="f-motor">N.° de motor</label><input id="f-motor" autocomplete="off" autocapitalize="characters" value="' + esc(cur.motor) + '"></div>' +
      '<div class="span2"><label for="f-chasis">Chasis / VIN</label><input id="f-chasis" autocomplete="off" autocapitalize="characters" value="' + esc(cur.chasis) + '"></div>' +
      '<div><label for="f-procedencia">Procedencia</label><input id="f-procedencia" autocomplete="off" value="' + esc(cur.procedencia) + '"></div>' +
      '<div><label for="f-fabricante">Fabricante</label><input id="f-fabricante" autocomplete="off" value="' + esc(cur.fabricante) + '"></div>' +
      '</div></div>' +
      (extraHtml ? '<div class="card" style="margin-top:12px"><h3>Antecedentes adicionales</h3><div class="grid2 field" style="margin-top:10px">' + extraHtml + '</div></div>' : '') +
      '<div class="btn-row" style="margin-top:12px"><button class="btn primary" id="btn-save">Guardar vehículo</button><button class="btn" id="btn-clear">Vehículo nuevo</button></div>' +
      '<div style="margin-top:24px"><h3>Guardados</h3>' +
      (savedPlates.length ? savedPlates.map(function (p) {
        var v = db.vehicles[p];
        return '<div class="saved-item"><button class="saved-load" data-load="' + esc(p) + '"><span class="mini-plate">' + esc(p) + '</span><span>' + esc([v.marca, v.modelo, v.anio].filter(Boolean).join(' ')) + '</span></button><button class="saved-del" data-del="' + esc(p) + '" aria-label="Borrar ' + esc(p) + '">×</button></div>';
      }).join('') : '<p class="muted" style="margin-top:6px">Aún no hay vehículos guardados.</p>') + '</div>';
  }

  function assistantView() {
    var hasCar = cur.marca || cur.modelo || L.isPlateOk(cur.plate);
    var key = chatKey();
    var th = db.chats[key] || [];
    var plateLabel = L.isPlateOk(cur.plate) ? cur.plate : 'SIN PATENTE';
    var mainVehicle = [cur.marca, cur.modelo, cur.anio].filter(Boolean).join(' ') || 'Vehículo sin identificar';
    var vehicleMeta = [cur.combustible, cur.km ? L.formatKm(cur.km) + ' km' : ''].filter(Boolean).join(' · ');
    var vehicleDetail = [cur.version, cur.motor ? 'Motor ' + cur.motor : '', cur.chasis ? 'VIN ' + cur.chasis : ''].filter(Boolean).join(' · ');
    var html = '<h2>Asistente</h2>';
    if (!hasCar) {
      html += '<div class="notice" style="margin:12px 0">Carga una patente y los datos del vehículo para que la IA pueda responder con mayor precisión. <button class="link-btn" data-tab-go="vehiculo">Ir a Vehículo</button></div>';
    }
    if (!(db.settings.apiKey || '').trim()) {
      html += '<div class="notice" style="margin:0 0 12px">Falta la clave gratuita de Gemini. <button class="link-btn" data-tab-go="ajustes">Pegarla en Ajustes</button></div>';
    }

    html += '<section class="assistant-chat-window whatsapp-chat" aria-label="Chat con el asistente">' +
      '<div class="assistant-chat-head whatsapp-head">' +
        '<div class="assistant-avatar" aria-hidden="true">' + ICONS.vehiculo + '</div>' +
        '<div class="assistant-contact">' +
          '<div class="assistant-contact-name">' + esc(plateLabel) + '</div>' +
          '<div class="assistant-contact-car">' + esc(mainVehicle) + '</div>' +
          (vehicleMeta ? '<div class="assistant-contact-meta">' + esc(vehicleMeta) + '</div>' : '') +
          (vehicleDetail ? '<div class="assistant-contact-detail">' + esc(vehicleDetail) + '</div>' : '') +
        '</div>' +
        (th.length ? '<button class="assistant-clear-icon" id="btn-clear-chat" aria-label="Borrar historial" title="Borrar historial">×</button>' : '') +
      '</div>' +
      '<div class="thread assistant-thread whatsapp-thread" id="chat-thread" aria-live="polite">' + th.map(function (m) {
        return '<div class="msg ' + (m.role === 'user' ? 'user' : 'model' + (m.error ? ' error' : '')) + '">' + (m.role === 'user' ? esc(m.text) : md(m.text)) + '</div>';
      }).join('') + (busy ? '<div class="msg model typing"><span class="spinner"></span> Consultando…</div>' : '') + '<div id="thread-end"></div></div>' +
      (pendingImage ? '<div class="assistant-attachment small muted">Foto lista para enviar. <button class="link-btn" id="btn-unattach">Quitar</button></div>' : '') +
      '<form class="composer assistant-composer whatsapp-composer" id="composer">' +
        '<button type="button" class="assistant-photo-btn whatsapp-photo" id="btn-attach" aria-label="Adjuntar foto" title="Adjuntar foto">＋</button>' +
        '<textarea id="chat-input" rows="2" placeholder="Escribe un mensaje…" aria-label="Mensaje"></textarea>' +
        '<button class="whatsapp-send" type="submit" aria-label="Enviar"' + (busy ? ' disabled' : '') + '>Enviar</button>' +
      '</form><input type="file" id="chat-photo" accept="image/*" hidden>' +
      '</section>';

    html += '<div class="assistant-quick-block"><div class="assistant-section-title">Preguntas rápidas a la IA</div><div class="chips assistant-chips-below" role="group" aria-label="Consultas rápidas">' +
      QUICK.map(function (q, i) { return '<button class="chip" data-quick="' + i + '"' + (busy ? ' disabled' : '') + '>' + esc(q[0]) + '</button>'; }).join('') + '</div></div>';

    var links = L.searchLinks(cur);
    if (links.length) {
      html += '<div class="assistant-recommendations"><div class="assistant-section-title">Recomendaciones para este vehículo</div>' +
        '<p class="muted small">Búsquedas rápidas para confirmar compatibilidad y catálogos en Google.</p><div class="links assistant-recommendation-links">' +
        links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '</a>'; }).join('') + '</div></div>';
    }
    return html;
  }

  function logView() {
    var html = '<h2>Libreta de mantención</h2>';
    if (!L.isPlateOk(cur.plate)) {
      return html + '<div class="empty card" style="margin-top:14px"><p>Escribe la patente en la pestaña Vehículo para ver o crear su historial.</p><button class="btn primary" data-tab-go="vehiculo">Ir a Vehículo</button></div>';
    }
    var list = db.log[cur.plate] || [];
    html += '<div class="summary"><div class="name">' + esc(cur.plate) + '</div><div class="meta">' + esc(vehicleName() || 'Sin marca ni modelo') + '</div></div>';
    html += '<button class="btn primary block" id="btn-add-entry">Registrar trabajo</button><div style="margin-top:16px">';
    if (!list.length) html += '<div class="empty muted"><p>Todavía no hay trabajos registrados para esta patente.</p></div>';
    html += list.map(function (e) {
      var next = [e.nextKm ? L.formatKm(e.nextKm) + ' km' : '', e.nextFecha ? L.formatDate(e.nextFecha) : ''].filter(Boolean).join(' o ');
      return '<div class="entry"><div class="head"><span class="title">' + esc(e.trabajo) + '</span><span class="muted small">' + esc(L.formatDate(e.fecha)) + '</span></div>' +
        '<div class="muted small">' + esc(e.km ? L.formatKm(e.km) + ' km' : 'Sin kilometraje') + '</div>' +
        (e.notas ? '<div style="margin-top:6px">' + esc(e.notas) + '</div>' : '') +
        (next ? '<div class="small" style="margin-top:6px">Próximo: ' + esc(next) + '</div>' : '') +
        '<div class="actions"><button class="btn" data-remind="' + esc(e.id) + '">Recordatorio</button><button class="btn danger" data-delentry="' + esc(e.id) + '">Borrar</button></div></div>';
    }).join('') + '</div>';
    return html;
  }

  function settingsView() {
    return '<h2>Ajustes</h2><div class="stack" style="margin-top:14px">' +
      '<div class="card"><h3>Inteligencia artificial (Gemini)</h3>' +
      '<p class="muted small" style="margin:6px 0 12px">Usa la clave gratuita de Google AI Studio. Se guarda solo en este teléfono. El plan gratuito tiene límites por minuto y por día, así que no es ilimitado.</p>' +
      '<p style="margin-bottom:12px"><a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--text)">Crear mi clave en Google AI Studio</a></p>' +
      '<div class="field"><label for="s-key">Clave de Gemini</label><input id="s-key" type="password" autocomplete="off" spellcheck="false" value="' + esc(db.settings.apiKey) + '"></div>' +
      '<div class="field" style="margin-top:12px"><label for="s-model">Modelo (déjalo vacío para elegirlo solo)</label><input id="s-model" autocomplete="off" spellcheck="false" placeholder="' + esc(db.settings.auto || 'automático') + '" value="' + esc(db.settings.model) + '"></div>' +
      '<div class="btn-row" style="margin-top:12px"><button class="btn" id="btn-detect">Detectar modelo</button><button class="btn primary" id="btn-test">Probar conexión</button></div>' +
      '<p class="small" id="test-out" style="margin-top:10px" aria-live="polite"></p></div>' +
      '<div class="card"><h3>Búsqueda automática por patente</h3>' +
      '<p class="muted small" style="margin:6px 0 8px">La consulta pasa por el backend de THOKAR y usa Boostr API. La clave de Boostr se guarda sólo como variable de entorno en Render y nunca se envía al teléfono.</p>' +
      '<p class="muted small">Los campos disponibles dependen de tu plan de Boostr. THOKAR solicita únicamente la ficha del vehículo y no pide información del propietario.</p></div>' +
      '<div class="card"><h3>Respaldo</h3><p class="muted small" style="margin:6px 0 12px">Vehículos, libreta y conversaciones. Descárgalo de vez en cuando por si cambias de teléfono o borras los datos del navegador.</p>' +
      '<div class="btn-row"><button class="btn" id="btn-export">Descargar respaldo</button><button class="btn" id="btn-import">Importar respaldo</button></div><input type="file" id="import-input" accept="application/json,.json" hidden></div>' +
      '<div class="card"><h3>Instalar en el teléfono</h3>' +
      '<p class="muted small" style="margin:6px 0 10px">Android (Chrome): menú ⋮ y luego "Instalar app". iPhone (Safari): botón Compartir y luego "Agregar a pantalla de inicio".</p>' +
      (installEvent ? '<button class="btn primary block" id="btn-install">Instalar ahora</button>' : '') + '</div>' +
      (storageOk ? '' : '<div class="notice">Este navegador no deja guardar datos. Lo que escribas se perderá al cerrar la app.</div>') +
      '<p class="muted small">THOKAR — Ingeniería que mueve</p></div>';
  }

  function render() {
    var app = $('#app');
    var view = tab === 'vehiculo' ? vehicleView() : tab === 'asistente' ? assistantView() : tab === 'libreta' ? logView() : settingsView();
    app.innerHTML = view;
    renderTabs();
  }

  /* ---------- Eventos ---------- */
  document.addEventListener('input', onField);
  document.addEventListener('change', function (e) {
    if (e.target.id === 'f-combustible') onField(e);
    if (e.target.id === 'photo-input') { readPhoto(e.target.files[0]); e.target.value = ''; }
    if (e.target.id === 'import-input') { importBackup(e.target.files[0]); e.target.value = ''; }
    if (e.target.id === 'chat-photo') {
      var f = e.target.files[0]; e.target.value = '';
      if (f) loadChatImage(f).then(function (b64) { pendingImage = b64; render(); }, function (er) { toast(er.message); });
    }
    if (e.target.id === 's-key') { db.settings.apiKey = e.target.value.trim(); persist(['settings']); toast('Clave guardada.'); }
    if (e.target.id === 's-model') { db.settings.model = e.target.value.trim(); persist(['settings']); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'composer') {
      e.preventDefault();
      var ta = $('#chat-input'); var v = ta.value; ta.value = '';
      ask(v);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.id === 'chat-input' && e.key === 'Enter' && !e.shiftKey && !e.isComposing && window.matchMedia('(min-width: 700px)').matches) {
      e.preventDefault(); $('#composer').requestSubmit();
    }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, a');
    if (!t) return;
    if (t.dataset.tab) return setTab(t.dataset.tab);
    if (t.dataset.tabGo) return setTab(t.dataset.tabGo);
    if (t.dataset.load) return loadVehicle(t.dataset.load);
    if (t.dataset.del) return deleteVehicle(t.dataset.del);
    if (t.dataset.quick) return ask(QUICK[+t.dataset.quick][1]);
    if (t.dataset.remind) return openReminder(t.dataset.remind);
    if (t.dataset.delentry) return deleteEntry(t.dataset.delentry);
    switch (t.id) {
      case 'btn-lookup': return lookupPlate();
      case 'btn-attach': return $('#chat-photo').click();
      case 'btn-unattach': pendingImage = ''; return render();
      case 'btn-paste': return openPaste();
      case 'btn-photo': return $('#photo-input').click();
      case 'btn-save': return saveVehicle();
      case 'btn-clear': cur = emptyVehicle(); saveDraft(); return render();
      case 'btn-clear-chat': db.chats[chatKey()] = []; persist(['chats']); return render();
      case 'btn-add-entry': return openEntry();
      case 'btn-export': return exportBackup();
      case 'btn-import': return $('#import-input').click();
      case 'btn-test': db.settings.apiKey = ($('#s-key').value || '').trim(); db.settings.model = ($('#s-model').value || '').trim(); persist(['settings']); return testConnection();
      case 'btn-detect': db.settings.apiKey = ($('#s-key').value || '').trim(); persist(['settings']); return doDetect();
      case 'btn-install': installEvent.prompt(); installEvent = null; return render();
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; if (tab === 'ajustes') render(); });
  window.addEventListener('offline', function () { toast('Sin internet. El asistente necesita conexión.'); });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  render();
})();
