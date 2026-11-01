const path = require('path');
const express = require('express');
const { lookupVehicle, closeBrowser } = require('./backend/patenteChileProvider');
const { cleanPlate } = require('./backend/vehicleParser');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');

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

// Límite simple por IP para proteger la fuente y evitar consultas masivas.
const buckets = new Map();
function rateLimit(req, res, next) {
  const now = Date.now();
  const windowMs = 60_000;
  const limit = Math.max(1, Number(process.env.PLATE_REQUESTS_PER_MINUTE || 8));
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const previous = buckets.get(key) || [];
  const active = previous.filter((ts) => now - ts < windowMs);
  if (active.length >= limit) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ ok: false, error: { code: 'RATE_LIMIT', message: 'Demasiadas consultas. Intenta de nuevo en un minuto.' } });
  }
  active.push(now);
  buckets.set(key, active);
  next();
}
setInterval(() => {
  const cutoff = Date.now() - 60_000;
  for (const [key, timestamps] of buckets) {
    const active = timestamps.filter((ts) => ts >= cutoff);
    if (active.length) buckets.set(key, active); else buckets.delete(key);
  }
}, 60_000).unref();

app.get('/healthz', (req, res) => {
  res.json({ ok: true, app: 'THOKAR Taller', vehicleLookup: 'backend' });
});

app.get('/api/vehiculo/:patente', rateLimit, async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const plate = cleanPlate(req.params.patente);
  if (!/^[A-Z0-9]{5,6}$/.test(plate)) {
    return res.status(400).json({ ok: false, error: { code: 'INVALID_PLATE', message: 'Patente inválida.' } });
  }

  try {
    const vehicle = await lookupVehicle(plate);
    // Importante: solo la lista blanca técnica producida por el proveedor llega al cliente.
    return res.json({ ok: true, source: 'patentechile.com', vehicle });
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

app.use(express.static(PUBLIC_DIR, {
  index: false,
  etag: true,
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
  setHeaders(res, filePath) {
    if (/\.(?:html|js|css|webmanifest)$/i.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
  }
}));

app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Endpoint no encontrado.' } });
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`THOKAR escuchando en puerto ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    await closeBrowser();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
