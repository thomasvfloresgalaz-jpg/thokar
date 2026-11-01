const { chromium } = require('playwright');

const SOURCE_URL = process.env.PATENTECHILE_URL || 'https://www.patentechile.com/';
const PROBE_PLATE = 'UB2023'; // Ejemplo publicado por PatenteChile en su propia web.

function cleanOriginHost(hostname) {
  return String(hostname || '').replace(/^www\./i, '').toLowerCase();
}

function sameSite(url) {
  try {
    const u = new URL(url);
    return cleanOriginHost(u.hostname) === 'patentechile.com';
  } catch {
    return false;
  }
}

function bodyKeys(postData) {
  if (!postData) return [];
  const text = String(postData);
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return Object.keys(obj).slice(0, 30);
  } catch {}
  try {
    const params = new URLSearchParams(text);
    return [...new Set([...params.keys()])].slice(0, 30);
  } catch {}
  return [];
}

function safeUrlMeta(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return {
      origin: u.origin,
      path: u.pathname,
      queryKeys: [...new Set([...u.searchParams.keys()])].slice(0, 30),
      containsProbePlate: rawUrl.toUpperCase().includes(PROBE_PLATE)
    };
  } catch {
    return { origin: '', path: '', queryKeys: [], containsProbePlate: false };
  }
}

async function findPlateInput(page) {
  const selectors = [
    'input[placeholder*="Ingrese Patente" i]',
    'input[placeholder*="AA1122" i]',
    'input[placeholder*="BBCC11" i]',
    'input[placeholder*="patente" i]',
    'input[name*="patente" i]',
    'input[id*="patente" i]',
    'input[name*="ppu" i]',
    'input[id*="ppu" i]'
  ];

  for (const frame of page.frames()) {
    for (const selector of selectors) {
      const loc = frame.locator(selector);
      const count = await loc.count().catch(() => 0);
      for (let i = 0; i < count; i += 1) {
        const el = loc.nth(i);
        if (await el.isVisible().catch(() => false) && await el.isEnabled().catch(() => false)) {
          return el;
        }
      }
    }
  }
  return null;
}

async function submitSearch(page, input) {
  const form = input.locator('xpath=ancestor::form[1]');
  if (await form.count().catch(() => 0)) {
    const buttons = form.locator('button, input[type="submit"]');
    const n = await buttons.count().catch(() => 0);
    for (let i = 0; i < n; i += 1) {
      const btn = buttons.nth(i);
      if (!(await btn.isVisible().catch(() => false))) continue;
      const text = `${await btn.innerText().catch(() => '')} ${await btn.getAttribute('value').catch(() => '')}`.trim();
      if (/buscar/i.test(text)) {
        await btn.click();
        return;
      }
    }
  }

  const exact = page.getByRole('button', { name: /^\s*Buscar\s*$/i }).first();
  if (await exact.count().catch(() => 0) && await exact.isVisible().catch(() => false)) {
    await exact.click();
    return;
  }
  await input.press('Enter');
}

function detectChallengeText(text) {
  return /captcha|cloudflare|verify you are human|verifica que eres humano|comprobando (?:tu )?navegador|access denied|attention required|verificaci[oó]n/i.test(text || '');
}

async function probePatenteChile() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  const observed = [];
  let submitted = false;

  const responseStatus = new Map();
  page.on('response', (response) => {
    if (!submitted || !sameSite(response.url())) return;
    const headers = response.headers();
    responseStatus.set(response.url(), {
      status: response.status(),
      contentType: String(headers['content-type'] || '').split(';')[0]
    });
  });

  page.on('request', (request) => {
    if (!submitted || !sameSite(request.url())) return;
    const type = request.resourceType();
    if (!['document', 'xhr', 'fetch'].includes(type)) return;
    const meta = safeUrlMeta(request.url());
    const post = request.postData() || '';
    observed.push({
      method: request.method(),
      resourceType: type,
      path: meta.path,
      queryKeys: meta.queryKeys,
      bodyKeys: bodyKeys(post),
      containsProbePlate: meta.containsProbePlate || post.toUpperCase().includes(PROBE_PLATE)
    });
  });

  try {
    const initial = await page.goto(SOURCE_URL, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(1500);
    const initialStatus = initial ? initial.status() : null;

    const input = await findPlateInput(page);
    if (!input) {
      const body = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
      return {
        ok: false,
        stage: 'find-input',
        initialStatus,
        challengeDetected: detectChallengeText(body),
        message: 'No se encontró el campo de patente.'
      };
    }

    await input.fill(PROBE_PLATE);
    submitted = true;
    await submitSearch(page, input);
    await page.waitForTimeout(8000);

    const body = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
    const challengeDetected = detectChallengeText(body);
    const finalUrl = safeUrlMeta(page.url());

    const unique = [];
    const seen = new Set();
    for (const item of observed) {
      const key = JSON.stringify(item);
      if (seen.has(key)) continue;
      seen.add(key);
      const matching = [...responseStatus.entries()].find(([url]) => {
        const m = safeUrlMeta(url);
        return m.path === item.path;
      });
      unique.push({
        ...item,
        status: matching ? matching[1].status : null,
        contentType: matching ? matching[1].contentType : ''
      });
    }

    return {
      ok: true,
      probePlate: PROBE_PLATE,
      initialStatus,
      challengeDetected,
      finalPath: finalUrl.path,
      finalQueryKeys: finalUrl.queryKeys,
      candidateRequests: unique.slice(0, 40),
      interpretation: unique.some((r) => r.containsProbePlate)
        ? 'Se observó al menos una petición que contiene la patente de prueba. Revísala como posible endpoint de búsqueda.'
        : 'No se observó una petición XHR/fetch/document que contuviera la patente de prueba; el sitio puede usar estado interno, JavaScript ofuscado o haber bloqueado antes la consulta.'
    };
  } finally {
    await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

module.exports = { probePatenteChile };
