const { chromium } = require('playwright');
const {
  cleanPlate,
  parseRows,
  parseVehicleText,
  sanitizeVehicle,
  hasUsefulVehicleData
} = require('./vehicleParser');

const SOURCE_URL = process.env.PATENTECHILE_URL || 'https://www.patentechile.com/';
const SOURCE_TIMEOUT_MS = Math.max(10000, Number(process.env.SOURCE_TIMEOUT_MS || 45000));

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
  const text = (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, 12000);
  if (/captcha|cloudflare|verify you are human|verifica que eres humano|comprobando (?:tu )?navegador|access denied/i.test(text)) {
    throw sourceError(
      'SOURCE_BLOCKED',
      'PatenteChile presentó una verificación o bloqueo automático. THOKAR no intenta evadirla; usa la carga manual mientras la fuente esté bloqueada.',
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
  throw sourceError('SOURCE_CHANGED', 'No pude localizar el campo de patente en PatenteChile. Es posible que el sitio haya cambiado.', 502);
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

  const visibleButtons = page.getByRole('button', { name: /^\s*(?:🔍\s*)?buscar\s*$/i });
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

async function extractTechnicalBlock(page) {
  return page.evaluate(() => {
    const privateRx = /(?:propietari|due[nñ]o|nombre\s+completo|\brut\b|\brun\b|direcci[oó]n|domicilio|tel[eé]fono|correo|e-?mail|fecha\s+de\s+nacimiento)/i;
    const vehicleRx = /informaci[oó]n\s+(?:del\s+)?veh[ií]culo|informaci[oó]n\s+vehicular/i;
    const usefulRx = /\b(marca|modelo|a[nñ]o|motor|chasis|vin|color|fabricante|procedencia)\b/i;

    const elements = Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,b,div,section,article,table'));
    const heading = elements.find((el) => vehicleRx.test((el.textContent || '').trim()) && (el.textContent || '').trim().length < 120);
    let container = null;
    if (heading) {
      let node = heading;
      for (let i = 0; i < 6 && node; i += 1, node = node.parentElement) {
        const text = (node.innerText || '').trim();
        if (usefulRx.test(text) && /marca/i.test(text) && /modelo/i.test(text) && !privateRx.test(text.slice(0, 500))) {
          container = node;
          break;
        }
      }
      if (!container) container = heading.parentElement;
    }

    if (!container) {
      const candidates = Array.from(document.querySelectorAll('table,section,article,.card,.table-responsive,div'))
        .map((el) => {
          const text = (el.innerText || '').trim();
          let score = 0;
          for (const rx of [/\bmarca\b/i,/\bmodelo\b/i,/\ba[nñ]o\b/i,/\bmotor\b/i,/\bchasis\b|\bvin\b/i,/\bcolor\b/i]) {
            if (rx.test(text)) score += 1;
          }
          if (privateRx.test(text)) score -= 3;
          return { el, text, score };
        })
        .filter((x) => x.score >= 3)
        .sort((a, b) => b.score - a.score || a.text.length - b.text.length);
      if (candidates.length) container = candidates[0].el;
    }

    if (!container) return { text: '', rows: [] };

    const rows = Array.from(container.querySelectorAll('tr')).map((tr) =>
      Array.from(tr.querySelectorAll('th,td')).map((cell) => (cell.innerText || '').replace(/\s+/g, ' ').trim()).filter(Boolean)
    ).filter((row) => row.length >= 2 && !privateRx.test(row.join(' ')));

    let text = (container.innerText || '').trim();
    text = text.split(/\n/).filter((line) => !privateRx.test(line)).join('\n').slice(0, 8000);
    return { text, rows };
  });
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

  // Reduce consumo sin bloquear JS/CSS necesarios para el formulario.
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

    await page.waitForFunction(() => {
      const text = (document.body && document.body.innerText) || '';
      return /informaci[oó]n\s+(?:del\s+)?veh[ií]culo|informaci[oó]n\s+vehicular/i.test(text)
        || /no\s+(?:se\s+)?encontr(?:aron|ó)|sin\s+resultados|patente\s+no\s+encontrada/i.test(text)
        || /captcha|cloudflare|verify you are human|verifica que eres humano/i.test(text);
    }, null, { timeout: SOURCE_TIMEOUT_MS }).catch(() => {});

    await detectBlocked(page);

    const bodyText = (await page.locator('body').innerText().catch(() => '')).slice(0, 16000);
    if (/no\s+(?:se\s+)?encontr(?:aron|ó)|sin\s+resultados|patente\s+no\s+encontrada/i.test(bodyText)) {
      throw sourceError('NOT_FOUND', 'PatenteChile no devolvió información técnica para esa patente.', 404);
    }

    const block = await extractTechnicalBlock(page);
    const fromRows = parseRows(block.rows);
    const fromText = parseVehicleText(block.text);
    const vehicle = sanitizeVehicle({ ...fromText, ...fromRows }, plate);

    if (!hasUsefulVehicleData(vehicle)) {
      throw sourceError(
        'SOURCE_CHANGED',
        'PatenteChile respondió, pero THOKAR no pudo reconocer la ficha técnica. El sitio puede haber cambiado su estructura.',
        502
      );
    }
    return vehicle;
  } catch (error) {
    if (error && error.code) throw error;
    if (error && /Timeout/i.test(error.message || '')) {
      throw sourceError('SOURCE_TIMEOUT', 'PatenteChile tardó demasiado en responder.', 504);
    }
    throw sourceError('SOURCE_ERROR', 'No se pudo completar la consulta técnica en PatenteChile.', 502);
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
