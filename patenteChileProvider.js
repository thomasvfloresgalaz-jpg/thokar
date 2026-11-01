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
const UI_WAIT_MS = Math.min(18000, Math.max(6000, Number(process.env.SOURCE_UI_WAIT_MS || 12000)));

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

async function isUsableInput(locator) {
  return Boolean(
    await locator.isVisible().catch(() => false) &&
    await locator.isEnabled().catch(() => false)
  );
}

async function findInputInFrame(frame) {
  // 1) Selectores basados en la interfaz pública observada actualmente.
  const preferredSelectors = [
    'input[placeholder*="Ingrese Patente" i]',
    'input[placeholder*="Ejemplo AA1122" i]',
    'input[placeholder*="BBCC11" i]',
    'input[placeholder*="Patente" i]',
    'input[aria-label*="patente" i]',
    'input[name*="patente" i]',
    'input[id*="patente" i]',
    'input[name*="ppu" i]',
    'input[id*="ppu" i]'
  ];

  for (const selector of preferredSelectors) {
    const matches = frame.locator(selector);
    const count = await matches.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const candidate = matches.nth(i);
      if (await isUsableInput(candidate)) return candidate;
    }
  }

  // 2) Heurística: puntúa inputs visibles. Esto evita depender de una clase/ID concreto.
  const inputs = frame.locator('input');
  const count = await inputs.count().catch(() => 0);
  let best = null;
  let bestScore = -Infinity;

  for (let i = 0; i < count; i += 1) {
    const el = inputs.nth(i);
    if (!(await isUsableInput(el))) continue;

    const type = String(await el.getAttribute('type').catch(() => '') || 'text').toLowerCase();
    if (['hidden', 'email', 'password', 'checkbox', 'radio', 'file', 'submit', 'button'].includes(type)) continue;

    const placeholder = String(await el.getAttribute('placeholder').catch(() => '') || '');
    const aria = String(await el.getAttribute('aria-label').catch(() => '') || '');
    const name = String(await el.getAttribute('name').catch(() => '') || '');
    const id = String(await el.getAttribute('id').catch(() => '') || '');
    const maxLengthRaw = await el.getAttribute('maxlength').catch(() => null);
    const maxLength = maxLengthRaw ? Number(maxLengthRaw) : NaN;
    const hint = `${placeholder} ${aria} ${name} ${id}`;

    let score = 0;
    if (/ingrese\s+patente|patente|ppu|placa/i.test(hint)) score += 16;
    if (/AA1122|BBCC11/i.test(hint)) score += 12;
    if (Number.isFinite(maxLength) && maxLength >= 5 && maxLength <= 8) score += 6;
    if (['text', 'search', 'tel'].includes(type)) score += 2;
    if (/correo|email|nombre|coment|buscar\s+en\s+el\s+sitio|search\s+site/i.test(hint)) score -= 20;

    const formText = await el.locator('xpath=ancestor::form[1]').innerText({ timeout: 1000 }).catch(() => '');
    if (/buscar/i.test(formText)) score += 5;
    if (/veh[ií]cul|moto|vin|rut/i.test(formText)) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  }

  // Un score alto identifica el buscador aunque cambien clases/IDs.
  if (best && bestScore >= 7) return best;
  return null;
}

async function collectSafeInputHints(page) {
  const hints = [];
  for (const frame of page.frames()) {
    const inputs = frame.locator('input');
    const count = Math.min(12, await inputs.count().catch(() => 0));
    for (let i = 0; i < count; i += 1) {
      const el = inputs.nth(i);
      if (!(await el.isVisible().catch(() => false))) continue;
      const type = String(await el.getAttribute('type').catch(() => '') || 'text').toLowerCase();
      const placeholder = String(await el.getAttribute('placeholder').catch(() => '') || '').slice(0, 80);
      const name = String(await el.getAttribute('name').catch(() => '') || '').slice(0, 50);
      // Solo metadatos del campo; jamás su value.
      hints.push([type, placeholder, name].filter(Boolean).join('/'));
      if (hints.length >= 8) return hints;
    }
  }
  return hints;
}

async function findPlateInput(page, { soft = false } = {}) {
  const deadline = Date.now() + UI_WAIT_MS;
  do {
    // El buscador podría estar en el documento principal o dentro de un iframe.
    for (const frame of page.frames()) {
      const candidate = await findInputInFrame(frame);
      if (candidate) return candidate;
    }
    await page.waitForTimeout(300);
  } while (Date.now() < deadline);

  if (soft) return null;
  const hints = await collectSafeInputHints(page);
  const suffix = hints.length ? ` Inputs visibles: ${hints.join(', ')}.` : ' No había inputs visibles.';
  throw sourceError(
    'SOURCE_CHANGED',
    'No pude localizar el campo de patente en PatenteChile.' + suffix,
    502
  );
}

async function clickVehicleMode(page) {
  const candidates = [
    page.getByRole('button', { name: /^\s*Buscar veh[ií]culos\s*$/i }).first(),
    page.getByText(/^\s*Buscar veh[ií]culos\s*$/i, { exact: true }).first()
  ];
  for (const el of candidates) {
    if (await el.count().catch(() => 0) && await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(250);
      return true;
    }
  }
  return false;
}

async function submitSearch(page, input) {
  // Preferir el botón submit del mismo formulario.
  const form = input.locator('xpath=ancestor::form[1]');
  if (await form.count().catch(() => 0)) {
    const exactButtons = form.locator('button, input[type="submit"]');
    const count = await exactButtons.count().catch(() => 0);
    for (let i = 0; i < count; i += 1) {
      const btn = exactButtons.nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;
      const text = `${await btn.innerText().catch(() => '')} ${await btn.getAttribute('value').catch(() => '')}`
        .replace(/[^a-záéíóúüñ]+/gi, ' ').trim();
      if (/^buscar$/i.test(text) || /buscar/i.test(text)) {
        await btn.click();
        return;
      }
    }
    await input.press('Enter');
    return;
  }

  // Fuera de form: escoger el botón cuyo nombre sea exactamente "Buscar",
  // no los tabs "Buscar vehículos / motos / RUT / VIN".
  const buttons = page.getByRole('button');
  const n = await buttons.count().catch(() => 0);
  for (let i = 0; i < n; i += 1) {
    const btn = buttons.nth(i);
    if (!(await btn.isVisible().catch(() => false))) continue;
    const name = String(await btn.innerText().catch(() => '') || '')
      .replace(/[^a-záéíóúüñ]+/gi, ' ').trim();
    if (/^buscar$/i.test(name)) {
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

    document.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll(':scope > th, :scope > td'))
        .map((cell) => clean(cell.innerText, 260)).filter(Boolean);
      if (cells.length >= 2) add(cells[0], cells.slice(1).join(' '));
    });

    document.querySelectorAll('dt').forEach((dt) => {
      const dd = dt.nextElementSibling;
      if (dd && dd.tagName && dd.tagName.toLowerCase() === 'dd') add(dt.innerText, dd.innerText);
    });

    document.querySelectorAll('li, p, div, section').forEach((el) => {
      const children = Array.from(el.children || []).filter((c) => clean(c.innerText, 300));
      if (children.length !== 2) return;
      const a = clean(children[0].innerText, 120);
      const b = clean(children[1].innerText, 240);
      if (a && b && a.length <= 100 && b.length <= 220) add(a, b);
    });

    document.querySelectorAll('label, strong, b, th, [class*="label" i], [class*="title" i]').forEach((el) => {
      const a = clean(el.innerText, 120);
      if (!a || a.length > 100) return;
      const sib = el.nextElementSibling;
      if (sib) {
        const b = clean(sib.innerText, 240);
        if (b && b.length <= 220) add(a, b);
      }
    });

    const text = clean(document.body && document.body.innerText, 30000);
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
    viewport: { width: 1440, height: 1000 }
    // Se usa el user-agent real del Chromium incluido con Playwright. Evita inconsistencias
    // entre la versión del navegador y un UA inventado que algunos sitios pueden detectar.
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
    await page.waitForLoadState('networkidle', { timeout: 7000 }).catch(() => {});
    await detectBlocked(page);

    // En la interfaz pública actual el modo vehículos ya muestra el input. Primero lo buscamos
    // sin tocar tabs; solo si no aparece intentamos seleccionar "Buscar vehículos" y reintentar.
    let input = await findPlateInput(page, { soft: true });
    if (!input) {
      await clickVehicleMode(page);
      input = await findPlateInput(page);
    }

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
        await page.waitForTimeout(900);
        const finalSnapshot = await extractPageSnapshot(page).catch(() => lastSnapshot);
        vehicle = mergeVehicle({
          text: `${lastSnapshot.text || ''}\n${finalSnapshot.text || ''}`,
          rows: [...(lastSnapshot.rows || []), ...(finalSnapshot.rows || [])]
        }, plate);
        return vehicle;
      }
    }

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
