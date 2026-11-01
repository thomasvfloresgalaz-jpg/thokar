const path = require('path');
const express = require('express');
const { lookupVehicle, cleanPlate } = require('./boostrProvider');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  next();
});


function requireAppToken(req, res, next) {
  const expected = String(process.env.APP_TOKEN || '').trim();
  if (!expected) return next();
  const got = String(req.get('X-THOKAR-TOKEN') || '').trim();
  if (!got || got !== expected) {
    return res.status(401).json({
      ok: false,
      error: { code: 'APP_AUTH', message: 'Token de acceso THOKAR inválido o ausente.' }
    });
  }
  next();
}

// Límite local conservador. Boostr documenta además su propio rate-limit.
const buckets = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 10_000;
  const limit = Math.max(1, Math.min(5, Number(process.env.PLATE_REQUESTS_PER_10_SECONDS || 4)));
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const previous = buckets.get(key) || [];
  const active = previous.filter((ts) => now - ts < windowMs);

  if (active.length >= limit) {
    res.setHeader('Retry-After', '10');
    return res.status(429).json({
      ok: false,
      error: { code: 'RATE_LIMIT', message: 'Demasiadas consultas. Espera unos segundos e intenta nuevamente.' }
    });
  }

  active.push(now);
  buckets.set(key, active);
  next();
}

setInterval(() => {
  const cutoff = Date.now() - 10_000;
  for (const [key, timestamps] of buckets) {
    const active = timestamps.filter((ts) => ts >= cutoff);
    if (active.length) buckets.set(key, active);
    else buckets.delete(key);
  }
}, 15_000).unref();

app.get('/healthz', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({
    ok: true,
    app: 'THOKAR Taller',
    vehicleLookup: 'boostr',
    configured: Boolean(String(process.env.BOOSTR_API_KEY || '').trim()),
    layout: 'flat',
    protected: Boolean(String(process.env.APP_TOKEN || '').trim()),
    build: '4.1.0-ux'
  });
});

app.get('/api/vehiculo/:patente', requireAppToken, rateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const plate = cleanPlate(req.params.patente);

  if (!/^[A-Z0-9]{5,6}$/.test(plate)) {
    return res.status(400).json({
      ok: false,
      error: { code: 'INVALID_PLATE', message: 'Patente inválida.' }
    });
  }

  try {
    const vehicle = await lookupVehicle(plate);
    return res.json({ ok: true, source: 'Boostr API', vehicle });
  } catch (error) {
    const status = Number(error.status || 502);
    return res.status(status).json({
      ok: false,
      error: {
        code: error.code || 'LOOKUP_FAILED',
        message: error.message || 'No fue posible consultar la patente.'
      }
    });
  }
});

// Estructura plana: sólo estos archivos de la raíz se publican.
// boostrProvider.js, server.js, .env y el resto del backend NO se sirven al navegador.
const PUBLIC_FILES = new Set([
  'index.html',
  'app.js',
  'lib.js',
  'styles.css',
  'sw.js',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'thokar-logo-original.jpg'
]);

function sendPublicFile(req, res, filename) {
  if (!PUBLIC_FILES.has(filename)) return res.status(404).end();
  if (/\.(?:html|js|css|webmanifest)$/i.test(filename)) {
    res.setHeader('Cache-Control', 'no-cache');
  } else {
    res.setHeader('Cache-Control', process.env.NODE_ENV === 'production' ? 'public, max-age=3600' : 'no-cache');
  }
  return res.sendFile(path.join(ROOT, filename));
}

app.get('/', (req, res) => sendPublicFile(req, res, 'index.html'));
for (const filename of PUBLIC_FILES) {
  if (filename === 'index.html') continue;
  app.get(`/${filename}`, (req, res) => sendPublicFile(req, res, filename));
}

app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      ok: false,
      error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado.' }
    });
  }
  return sendPublicFile(req, res, 'index.html');
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`THOKAR escuchando en puerto ${PORT} · proveedor Boostr`);
});

function shutdown() {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
