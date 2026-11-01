const { chromium } = require('playwright');
const {
  cleanPlate,
  parseRows,
  parseVehicleText,
  sanitizeVehicle,
  hasUsefulVehicleData
} = require('./vehicleParser');

const SOURCE_URL = process.env.PATENTECHILE_URL || 'https://www.patentechile.com/';
const SOURCE_TIMEOUT_MS = Math.max(10000, Number(process.env.SOURCE_TIMEOUT_MS || 55000));

let browserPromise;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: process.env.HEADLESS !== 'false',
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    }).catch((error) => {
      browserPromise = null;
      throw error;
    });
  }
  return browserPromise;
}

function sourceError(code, message, status = 502) {
  const err = new Error(message);
  err.code = code;
  err.status = status;
  return err;
}

async function detectBlocked(page) {
  const text = (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, 16000);
  if (/captcha|cloudflare|verify you are human|verifica que eres humano|comprobando (?:tu )?navegador|access denied|attention required/i.test(text)) {
    throw sourceError(
      'SOURCE_BLOCKED',
      'PatenteChile presentó una verificación o bloqueo automático. THOKAR no intenta evadirla.',
      503
    );
  }
}

async function findPlateInput(page) {
  const preferredSet = page.locator([
    'input[placeholder*="Patente" i]',
    'input[placeholder*="AA1122" i]',
    'input[placeholder*="BBCC11" i]',
    'input[name*="patente" i]',
    'input[id*="patente" i]'
  ].join(', '));
  const preferredCount = await preferredSet.count();
  for (let i = 0; i < preferredCount; i += 1) {
    const preferred = preferredSet.nth(i);
    if (await preferred.isVisible().catch(() => false)) return preferred;
  }

  const inputs = page.locator('input[type="text"], input[type="search"], input:not([type])');
  const n = await inputs.count();
  for (let i = 0; i < n; i += 1) {
    const el = inputs.nth(i);
    if (!(await el.isVisible().catch(() => false))) continue;
    const hint = [await el.getAttribute('placeholder'), await el.getAttribute('aria-label'), await el.getAttribute('name')]
      .filter(Boolean).join(' ');
    if (/patente|ppu|placa|AA1122|BBCC11/i.test(hint)) return el;
  }
  throw sourceError('SOURCE_CHANGED', 'No pude localizar el campo de patente en PatenteChile.', 502);
}

async function clickVehicleMode(page) {
  const candidates = [
    page.getByRole('button', { name: /buscar veh[ií]culos/i }).first(),
    page.getByText(/buscar veh[ií]culos/i, { exact: true }).first()
  ];
  for (const el of candidates) {
    if (await el.count() && await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 5000 }).catch(() => {});
      return;
    }
  }
}

async function submitSearch(page, input) {
  const form = input.locator('xpath=ancestor::form[1]');
  if (await form.count()) {
    const button = form.getByRole('button', { name: /buscar/i }).first();
    if (await button.count() && await button.isVisible().catch(() => false)) {
      await button.click();
      return;
    }
    await input.press('Enter');
    return;
  }

  const visibleButtons = page.getByRole('button', { name: /buscar/i });
  const n = await visibleButtons.count();
  for (let i = n - 1; i >= 0; i -= 1) {
    const btn = visibleButtons.nth(i);
    if (await btn.isVisible().catch(() => false)) {
      await btn.click();
      return;
    }
  }
  await input.press('Enter');
}

// Extrae la página completa con heurísticas que no dependen de una clase/card concreta.
// Solo se devuelven pares; el parser de servidor aplica una lista blanca de datos no personales.
async function extractPageSnapshot(page) {
  return page.evaluate(() => {
    const clean = (v, max = 300) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);
    const rows = [];
    const seen = new Set();
    const add = (a, b) => {
      const label = clean(a, 120);
      const value = clean(b, 240);
      if (!label || !value || label === value) return;
      const key = `${label}\u0000${value}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push([label, value]);
    };

    // Tablas actuales o futuras.
    document.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll(':scope > th, :scope > td'))
        .map((cell) => clean(cell.innerText, 260)).filter(Boolean);
      if (cells.length >= 2) add(cells[0], cells.slice(1).join(' '));
    });

    // Listas de definición.
    document.querySelectorAll('dt').forEach((dt) => {
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName && dd.tagName.toLowerCase() === 'dd') add(dt.innerText, dd.innerText);
    });

    // Contenedores de dos columnas/card: etiqueta + valor.
    document.querySelectorAll('li, p, div, section').forEach((el) => {
      const children = Array.from(el.children || []).filter((c) => clean(c.innerText, 300));
      if (children.length !== 2) return;
      const a = clean(children[0].innerText, 120);
      const b = clean(children[1].innerText, 240);
      if (a && b && a.length <= 100 && b.length <= 220) add(a, b);
    });

    // Etiquetas comunes seguidas por un hermano con valor.
    document.querySelectorAll('label, strong, b, th, [class*="label" i], [class*="title" i]').forEach((el) => {
      const a = clean(el.innerText, 120);
      if (!a || a.length > 100) return;
      let sib = el.nextElementSibling;
      if (sib) {
        const b = clean(sib.innerText, 240);
        if (b && b.length <= 220) add(a, b);
      }
    });

    const text = clean(document.body && document.body.innerText, 30000);
    // Mantener saltos para el parser línea-a-línea.
    const rawText = String((document.body && document.body.innerText) || '').slice(0, 30000);
    return { text: rawText, compactText: text, rows: rows.slice(0, 800) };
  });
}

function mergeVehicle(snapshot, plate) {
  const fromRows = parseRows(snapshot.rows || []);
  const fromText = parseVehicleText(snapshot.text || '');
  return sanitizeVehicle({ ...fromText, ...fromRows }, plate);
}

async function lookupVehicle(requestedPlate) {
  const plate = cleanPlate(requestedPlate);
  if (!/^[A-Z0-9]{5,6}$/.test(plate)) {
    throw sourceError('INVALID_PLATE', 'La patente debe tener 5 o 6 caracteres alfanuméricos.', 400);
  }

  const browser = await getBrowser();
  const context = await browser.newContext({
    locale: 'es-CL',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156 Safari/537.36'
  });
  const page = await context.newPage();
  page.setDefaultTimeout(SOURCE_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(SOURCE_TIMEOUT_MS);

  await page.route('**/*', async (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font'].includes(type)) return route.abort();
    return route.continue();
  });

  try {
    await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: SOURCE_TIMEOUT_MS });
    await detectBlocked(page);
    await clickVehicleMode(page);

    const input = await findPlateInput(page);
    await input.fill(plate);
    await submitSearch(page, input);

    const deadline = Date.now() + SOURCE_TIMEOUT_MS;
    let lastSnapshot = { text: '', compactText: '', rows: [] };
    let vehicle = {};

    while (Date.now() < deadline) {
      await page.waitForTimeout(650);
      await detectBlocked(page);
      lastSnapshot = await extractPageSnapshot(page);
      const body = lastSnapshot.text || '';

      if (/no\s+(?:se\s+)?encontr(?:aron|ó)|sin\s+resultados|patente\s+no\s+encontrada|no\s+encontramos\s+(?:la\s+)?patente/i.test(body)) {
        throw sourceError('NOT_FOUND', 'PatenteChile no devolvió información para esa patente.', 404);
      }

      vehicle = mergeVehicle(lastSnapshot, plate);
      if (hasUsefulVehicleData(vehicle)) {
        // Un pequeño segundo muestreo permite que aparezcan bloques que cargan después del resumen principal.
        await page.waitForTimeout(900);
        const finalSnapshot = await extractPageSnapshot(page).catch(() => lastSnapshot);
        vehicle = mergeVehicle({
          text: `${lastSnapshot.text || ''}\n${finalSnapshot.text || ''}`,
          rows: [...(lastSnapshot.rows || []), ...(finalSnapshot.rows || [])]
        }, plate);
        return vehicle;
      }
    }

    // Diagnóstico seguro: solo etiquetas reconocibles, nunca contenido personal ni HTML bruto.
    const observed = [];
    for (const row of lastSnapshot.rows || []) {
      const label = String(row && row[0] || '').replace(/\s+/g, ' ').trim();
      if (label && label.length <= 80 && !/propietari|titular|due[nñ]o|nombre|apellido|rut|run|direcci[oó]n|domicilio|tel[eé]fono|correo|mail|nacimiento/i.test(label)) {
        observed.push(label);
      }
      if (observed.length >= 12) break;
    }
    const suffix = observed.length ? ` Etiquetas visibles: ${[...new Set(observed)].slice(0, 8).join(', ')}.` : '';
    throw sourceError(
      'SOURCE_CHANGED',
      'PatenteChile respondió, pero THOKAR no encontró campos vehiculares reconocibles.' + suffix,
      502
    );
  } catch (error) {
    if (error && error.code) throw error;
    if (error && /Timeout/i.test(error.message || '')) {
      throw sourceError('SOURCE_TIMEOUT', 'PatenteChile tardó demasiado en responder.', 504);
    }
    throw sourceError('SOURCE_ERROR', 'No se pudo completar la consulta en PatenteChile.', 502);
  } finally {
    await context.close().catch(() => {});
  }
}

async function closeBrowser() {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => {});
}

module.exports = { lookupVehicle, closeBrowser };
