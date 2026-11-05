const path = require('path');
const crypto = require('crypto');
const express = require('express');
const { lookupVehicleMulti, lookupBoostrSupplement, cleanPlate, isBoostrConfigured } = require('./vehicleProvider');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '3mb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

function sameOriginOnly(req, res, next) {
  const origin = String(req.get('Origin') || '').trim();
  if (!origin) return next();
  const expected = `${req.protocol}://${req.get('host')}`;
  if (origin !== expected) {
    return res.status(403).json({ ok: false, error: { code: 'ORIGIN_DENIED', message: 'Origen no permitido.' } });
  }
  next();
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''), 'utf8');
  const bb = Buffer.from(String(b || ''), 'utf8');
  if (aa.length !== bb.length || !aa.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function requireAppToken(req, res, next) {
  const expected = String(process.env.APP_TOKEN || '').trim();
  if (expected.length < 32) {
    return res.status(503).json({
      ok: false,
      error: { code: 'APP_NOT_PROTECTED', message: 'Configura APP_TOKEN en Render con al menos 32 caracteres.' }
    });
  }
  const got = String(req.get('X-THOKAR-TOKEN') || '').trim();
  if (!safeEqual(got, expected)) {
    return res.status(401).json({
      ok: false,
      error: { code: 'APP_AUTH', message: 'Token de acceso THOKAR inválido o ausente.' }
    });
  }
  next();
}

function makeRateLimit({ windowMs, limit, code = 'RATE_LIMIT' }) {
  const buckets = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of buckets) {
      const active = timestamps.filter((ts) => ts >= cutoff);
      if (active.length) buckets.set(key, active); else buckets.delete(key);
    }
  }, Math.min(windowMs, 30_000)).unref();

  return function rateLimit(req, res, next) {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const active = (buckets.get(key) || []).filter((ts) => now - ts < windowMs);
    if (active.length >= limit) {
      const retry = Math.max(1, Math.ceil((windowMs - (now - active[0])) / 1000));
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ ok: false, retryAfter: retry, error: { code, retryAfter: retry, message: 'Demasiadas solicitudes. Espera un momento e intenta nuevamente.' } });
    }
    active.push(now); buckets.set(key, active); next();
  };
}

const plateRateLimit = makeRateLimit({ windowMs: 60_000, limit: Math.max(2, Math.min(30, Number(process.env.PLATE_REQUESTS_PER_MINUTE || 12))), code: 'PLATE_RATE_LIMIT' });
const aiRateLimit = makeRateLimit({ windowMs: 60_000, limit: Math.max(2, Math.min(60, Number(process.env.AI_REQUESTS_PER_MINUTE || 30))), code: 'AI_RATE_LIMIT' });

const plateCache = new Map();
const PLATE_CACHE_MS = Math.max(60_000, Math.min(24 * 60 * 60 * 1000, Number(process.env.PLATE_CACHE_MS || 6 * 60 * 60 * 1000)));
function getCachedLookup(plate) {
  const hit = plateCache.get(plate);
  if (!hit) return null;
  if (Date.now() - hit.at > PLATE_CACHE_MS) { plateCache.delete(plate); return null; }
  return hit.result || null;
}

function geminiConfig() {
  return {
    apiKey: String(process.env.GEMINI_API_KEY || '').trim(),
    model: String(process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim(),
    fallbackModel: String(process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.6-flash').trim()
  };
}

function validateGeminiBody(input) {
  if (!input || typeof input !== 'object' || !Array.isArray(input.contents) || !input.contents.length) return null;
  const contents = input.contents.slice(-16).map((content) => {
    const role = content && content.role === 'model' ? 'model' : 'user';
    const parts = Array.isArray(content && content.parts) ? content.parts.slice(0, 4).map((part) => {
      if (part && typeof part.text === 'string') return { text: part.text.slice(0, 20_000) };
      const inline = part && (part.inline_data || part.inlineData);
      if (inline && inline.mime_type === 'image/jpeg' && typeof inline.data === 'string' && inline.data.length <= 2_200_000) {
        return { inline_data: { mime_type: 'image/jpeg', data: inline.data } };
      }
      return null;
    }).filter(Boolean) : [];
    return { role, parts };
  }).filter((c) => c.parts.length);
  if (!contents.length) return null;
  const out = { contents };
  if (input.systemInstruction && Array.isArray(input.systemInstruction.parts)) {
    const text = input.systemInstruction.parts.map((p) => p && p.text || '').join('\n').slice(0, 18_000);
    if (text) out.systemInstruction = { parts: [{ text }] };
  }
  const cfg = input.generationConfig && typeof input.generationConfig === 'object' ? input.generationConfig : {};
  out.generationConfig = {
    temperature: Number.isFinite(Number(cfg.temperature)) ? Math.max(0, Math.min(1.5, Number(cfg.temperature))) : 0.3,
    thinkingConfig: { thinkingLevel: 'low' }
  };
  if (cfg.responseMimeType === 'application/json') out.generationConfig.responseMimeType = 'application/json';
  return out;
}

function geminiErrorMessage(status, payload) {
  const raw = payload && payload.error && payload.error.message ? String(payload.error.message) : '';
  if (status === 400) return 'Gemini no aceptó la solicitud.' + (raw ? ' ' + raw.slice(0, 180) : '');
  if (status === 401 || status === 403) return 'Gemini rechazó GEMINI_API_KEY en Render.';
  if (status === 404) return 'El modelo configurado en GEMINI_MODEL no está disponible.';
  if (status === 429) return 'Gemini alcanzó su límite temporal. Intenta nuevamente en un momento.';
  if (status >= 500) return 'Gemini no está disponible en este momento.';
  return 'No se pudo completar la consulta a Gemini.';
}

async function googleGeminiFetch(mode, input, signal, modelOverride) {
  const { apiKey, model } = geminiConfig();
  const selectedModel = String(modelOverride || model).trim();
  if (!apiKey) {
    const error = new Error('Falta configurar GEMINI_API_KEY en Render.');
    error.status = 503; error.code = 'GEMINI_NOT_CONFIGURED'; throw error;
  }
  const body = validateGeminiBody(input);
  if (!body) {
    const error = new Error('Solicitud de IA inválida.'); error.status = 400; error.code = 'AI_BAD_REQUEST'; throw error;
  }
  const suffix = mode === 'stream' ? ':streamGenerateContent?alt=sse' : ':generateContent';
  const response = await fetch(`${GEMINI_BASE}/models/${encodeURIComponent(selectedModel)}${suffix}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey, 'User-Agent': 'THOKAR-ZERO/5.2.4' },
    body: JSON.stringify(body), signal
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(geminiErrorMessage(response.status, payload));
    error.status = response.status === 429 ? 429 : response.status;
    error.code = response.status === 429 ? 'GEMINI_RATE_LIMIT' : 'GEMINI_API_ERROR';
    const retryAfter = Number(response.headers.get('retry-after') || 0);
    if (Number.isFinite(retryAfter) && retryAfter > 0) error.retryAfter = Math.ceil(retryAfter);
    throw error;
  }
  return response;
}


function geminiRetryable(error) {
  if (!error) return false;
  if (error.name === 'AbortError') return true;
  return [408, 429, 500, 502, 503, 504].includes(Number(error.status || 0));
}

async function googleGeminiFetchResilient(mode, input, outerSignal) {
  const cfg = geminiConfig();
  const models = [cfg.model, cfg.fallbackModel].filter((v, i, a) => v && a.indexOf(v) === i);
  const attempts = models.slice(0, 2); // máximo dos llamadas externas por acción del usuario
  let lastError;
  for (let attempt = 0; attempt < attempts.length; attempt++) {
    if (outerSignal && outerSignal.aborted) { const e = new Error('Solicitud cancelada.'); e.name = 'AbortError'; throw e; }
    if (attempt) await new Promise((r) => setTimeout(r, 1800 + Math.floor(Math.random() * 350)));
    const ctl = new AbortController();
    const onAbort = () => ctl.abort();
    if (outerSignal) outerSignal.addEventListener('abort', onAbort, { once: true });
    const perAttemptMs = mode === 'stream' ? 30_000 : 27_000;
    const timer = setTimeout(() => ctl.abort(), perAttemptMs);
    try {
      const response = await googleGeminiFetch(mode, input, ctl.signal, attempts[attempt]);
      clearTimeout(timer);
      if (outerSignal) outerSignal.removeEventListener('abort', onAbort);
      return response;
    } catch (error) {
      clearTimeout(timer);
      if (outerSignal) outerSignal.removeEventListener('abort', onAbort);
      lastError = error;
      if (!geminiRetryable(error) || attempt === attempts.length - 1) throw error;
    }
  }
  throw lastError || new Error('Gemini no respondió.');
}

app.get('/healthz', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const tokenReady = String(process.env.APP_TOKEN || '').trim().length >= 32;
  res.json({
    ok: true,
    app: 'THOKAR Taller',
    vehicleLookup: 'autoriesgo+prt+sii -> boostr fallback/manual',
    configured: true,
    autoRiesgoConfigured: true,
    restartConfigured: true,
    restartKeyConfigured: Boolean(String(process.env.RESTART_API_KEY || '').trim()),
    boostrConfigured: isBoostrConfigured(),
    geminiConfigured: Boolean(geminiConfig().apiKey),
    model: geminiConfig().model,
    layout: 'zero-5.2.4',
    protected: tokenReady,
    build: 'zero-5.3.2'
  });
});

app.use('/api', sameOriginOnly, requireAppToken);

app.get('/api/vehiculo/:patente', plateRateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const plate = cleanPlate(req.params.patente);
  if (!/^[A-Z0-9]{5,6}$/.test(plate)) {
    return res.status(400).json({ ok: false, error: { code: 'INVALID_PLATE', message: 'Patente inválida.' } });
  }
  const cached = getCachedLookup(plate);
  if (cached) return res.json({ ok: true, source: cached.source + ' · caché THOKAR', providers: cached.providers, cached: true, vehicle: cached.vehicle });
  try {
    const result = await lookupVehicleMulti(plate);
    plateCache.set(plate, { at: Date.now(), result });
    return res.json({ ok: true, source: result.source, providers: result.providers, cached: false, vehicle: result.vehicle });
  } catch (error) {
    const status = Number(error.status || 502);
    const retryAfter = Number(error.retryAfter || 0);
    if (status === 429 && retryAfter > 0) res.setHeader('Retry-After', String(Math.ceil(retryAfter)));
    return res.status(status).json({ ok: false, retryAfter: retryAfter || undefined, error: { code: error.code || 'LOOKUP_FAILED', retryAfter: retryAfter || undefined, message: error.message || 'No fue posible consultar la patente.' } });
  }
});

app.get('/api/vehiculo/:patente/boostr', plateRateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const plate = cleanPlate(req.params.patente);
  if (!/^[A-Z0-9]{5,6}$/.test(plate)) return res.status(400).json({ ok: false, error: { code: 'INVALID_PLATE', message: 'Patente inválida.' } });
  try {
    const result = await lookupBoostrSupplement(plate);
    return res.json({ ok: true, source: result.source, providers: result.providers, vehicle: result.vehicle });
  } catch (error) {
    const status = Number(error.status || 502);
    return res.status(status).json({ ok: false, error: { code: error.code || 'BOOSTR_FAILED', message: error.message || 'No fue posible consultar Boostr.' } });
  }
});

app.post('/api/ai/json', aiRateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 135_000);
  try {
    const response = await googleGeminiFetchResilient('json', req.body, ctl.signal);
    const payload = await response.json();
    const parts = payload && payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts;
    const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('').trim() : '';
    if (!text) return res.status(502).json({ ok: false, error: { code: 'GEMINI_EMPTY', message: 'Gemini no devolvió texto.' } });
    return res.json({ ok: true, text });
  } catch (error) {
    const status = error.name === 'AbortError' ? 504 : Number(error.status || 502);
    const code = error.name === 'AbortError' ? 'GEMINI_TIMEOUT' : (error.code || 'GEMINI_FAILED');
    const retryAfter = Number(error.retryAfter || 0);
    if (status === 429 && retryAfter > 0) res.setHeader('Retry-After', String(Math.ceil(retryAfter)));
    return res.status(status).json({ ok: false, retryAfter: retryAfter || undefined, error: { code, retryAfter: retryAfter || undefined, message: error.name === 'AbortError' ? 'Gemini tardó demasiado en responder.' : error.message } });
  } finally { clearTimeout(timer); }
});

app.post('/api/ai/stream', aiRateLimit, async (req, res) => {
  const ctl = new AbortController();
  res.on('close', () => { if (!res.writableEnded) ctl.abort(); });
  const timer = setTimeout(() => ctl.abort(), 145_000);
  try {
    const response = await googleGeminiFetchResilient('stream', req.body, ctl.signal);
    res.status(200);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\r?\n\r?\n/);
      buffer = events.pop() || '';
      for (const event of events) {
        const dataLines = event.split(/\r?\n/).filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim());
        for (const raw of dataLines) {
          if (!raw || raw === '[DONE]') continue;
          try {
            const payload = JSON.parse(raw);
            const parts = payload && payload.candidates && payload.candidates[0] && payload.candidates[0].content && payload.candidates[0].content.parts;
            const text = Array.isArray(parts) ? parts.map((p) => p.text || '').join('') : '';
            if (text) res.write(text);
          } catch (_) {}
        }
      }
    }
    res.end();
  } catch (error) {
    if (!res.headersSent) {
      const status = error.name === 'AbortError' ? 504 : Number(error.status || 502);
      const retryAfter = Number(error.retryAfter || 0);
      if (status === 429 && retryAfter > 0) res.setHeader('Retry-After', String(Math.ceil(retryAfter)));
      return res.status(status).json({ ok: false, retryAfter: retryAfter || undefined, error: { code: error.code || 'GEMINI_FAILED', retryAfter: retryAfter || undefined, message: error.name === 'AbortError' ? 'Gemini tardó demasiado en responder.' : error.message } });
    }
    res.end();
  } finally { clearTimeout(timer); }
});

const PUBLIC_FILES = new Set([
  'index.html', 'app.js', 'lib.js', 'styles.css', 'sw.js', 'manifest.webmanifest',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon-48.png', 'thokar-logo.png'
]);

function sendPublicFile(req, res, filename) {
  if (!PUBLIC_FILES.has(filename)) return res.status(404).end();
  if (/\.(?:html|js|css|webmanifest)$/i.test(filename)) res.setHeader('Cache-Control', 'no-cache');
  else res.setHeader('Cache-Control', process.env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-cache');
  return res.sendFile(path.join(ROOT, filename));
}

app.get('/', (req, res) => sendPublicFile(req, res, 'index.html'));
for (const filename of PUBLIC_FILES) {
  if (filename === 'index.html') continue;
  app.get(`/${filename}`, (req, res) => sendPublicFile(req, res, filename));
}

app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado.' } });
  return sendPublicFile(req, res, 'index.html');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`THOKAR escuchando en puerto ${PORT} · Boostr + Gemini backend`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
