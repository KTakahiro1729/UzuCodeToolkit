// The standalone way of render.mjs: the work's build page is put into about:blank with setContent (a sandbox that
// forbids navigation allows that), `<base href>` points at a made-up origin, and every request to it is answered from
// the build folder by page.route. The UZU SDK is the work's own: with `window.FlutterHost` present it takes itself to be
// in the host, and with no room it runs a single-player game of its own (seat local_0). So the work's real code and CSS
// run; only the host is missing.
//
// Limits, all said in the result: one seat (a screen of another seat is not drawn), and a screen is reached by taps and
// steps (click, fill, waitFor, wait), not by setting the game state, which only the harness can do.
import { execFile } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = (f) => new URL(f, import.meta.url);
const BASE = 'https://app.invalid/';
const STEP_MS = 15_000;
const SIZES = {
  lower: { landscape: [780, 360], portrait: [360, 780] },
  device: { landscape: [844, 390], portrait: [390, 844] },
  wide: { landscape: [1194, 834], portrait: [834, 1194] },
  reference: { landscape: [874, 402], portrait: [402, 874] },
};
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.webp': 'image/webp', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.txt': 'text/plain', '.wasm': 'application/wasm',
};

const run = (cmd, cwd) => new Promise((done) => execFile(cmd, { cwd, shell: true, timeout: 180_000 }, (error, out, err) => done({ error, out: `${out}${err}` })));

/** The folder of the work's build: the manifest's `output`, built first if it is not there. */
async function buildFolder(workDir) {
  const manifest = JSON.parse(readFileSync(join(workDir, 'manifest.json'), 'utf8'));
  const dist = resolve(workDir, manifest.output ?? 'dist');
  if (existsSync(join(dist, 'index.html'))) return { dist };
  const built = await run(manifest.build ?? 'npm run build', workDir);
  if (built.error || !existsSync(join(dist, 'index.html'))) return { reason: `no build in ${dist} and \`${manifest.build ?? 'npm run build'}\` failed: ${built.out.trim().split('\n').slice(-3).join(' | ')}` };
  return { dist };
}

/** A screen's `next` taps, then its steps, as capture.mjs plays them, for the harness-free ones. */
function planOf(screens, key, picked) {
  const at = screens.findIndex((s, i) => picked(s, i));
  if (at < 0) return { reason: `no screen "${key}"` };
  const plan = [];
  for (const s of screens.slice(0, at + 1)) {
    plan.push({ taps: s.taps ?? 0 });
    for (const st of s.steps ?? []) {
      if ('state' in st || st.fresh) return { reason: 'the screen is reached by setting the game state, which only the harness can do' };
      plan.push(st);
    }
    if (s.wait !== undefined) plan.push({ wait: s.wait });
  }
  return { plan, screen: screens[at] };
}

export async function renderStandalone(workDir, spec, out, configFile) {
  let browser;
  try {
    const { dist, reason } = await buildFolder(workDir);
    if (!dist) return { ok: false, reason };
    const config = (await import(pathToFileURL(configFile).href)).default;
    const key = spec.screen;
    const picked = (s, i) => s.key === key || String(i + 1).padStart(2, '0') === key || s.key.startsWith(`${key}-`);
    const { plan, screen, reason: why } = planOf(config.screens, key, picked);
    if (!plan) return { ok: false, reason: why };

    const { chromium } = createRequire(join(workDir, 'package.json'))('playwright');
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
    const [width, height] = SIZES[spec.size][spec.orientation];
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
    await context.addInitScript('window.FlutterHost = { postMessage() {} };');
    const page = await context.newPage();
    const messages = [];
    const note = (line) => { if (!messages.includes(line)) messages.push(line); };
    page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
    page.on('pageerror', (e) => note(`page error: ${e.message}`));
    await page.route(`${BASE}**`, (route) => {
      const path = decodeURIComponent(new URL(route.request().url()).pathname.slice(1)) || 'index.html';
      const file = normalize(join(dist, path));
      if (file.startsWith(dist) && existsSync(file) && extname(file) !== '') {
        route.fulfill({ status: 200, contentType: TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', headers: { 'access-control-allow-origin': '*' }, body: readFileSync(file) });
      } else {
        note(`404: ${BASE}${path}`);
        route.fulfill({ status: 404, body: 'not found' });
      }
    });

    const html = readFileSync(join(dist, 'index.html'), 'utf8').replace(/(<head[^>]*>)/i, `$1<base href="${BASE}">`);
    await page.goto('about:blank');
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForSelector('main', { timeout: STEP_MS });

    const settle = (quiet = 120) => page.evaluate((quiet) => new Promise((resolve) => {
      let t;
      const done = () => { obs.disconnect(); clearTimeout(t); clearTimeout(cap); requestAnimationFrame(() => requestAnimationFrame(resolve)); };
      const arm = () => { clearTimeout(t); t = setTimeout(done, quiet); };
      const obs = new MutationObserver(arm);
      const cap = setTimeout(done, 2000);
      document.fonts.ready.then(() => { obs.observe(document, { subtree: true, childList: true, attributes: true, characterData: true }); arm(); });
    }), quiet);

    await settle();
    for (const step of plan) {
      if ('taps' in step) {
        for (let i = 0; i < step.taps; i++) {
          const el = page.locator(config.next).first();
          if (!(await el.count())) break;
          await el.evaluate((e) => e.click());
          await settle(50);
        }
      } else if ('click' in step) {
        const el = page.locator(step.click).first();
        await el.waitFor({ state: 'visible', timeout: STEP_MS });
        await el.evaluate((e) => e.click());
        await settle(50);
      } else if ('fill' in step) await page.locator(step.fill).first().fill(step.text, { timeout: STEP_MS });
      else if ('waitFor' in step) await page.locator(step.waitFor).first().waitFor({ state: 'visible', timeout: STEP_MS });
      else if ('wait' in step) await page.waitForTimeout(step.wait);
      else if ('reload' in step) note('standalone: a reload step is skipped (the game would start over)');
      else throw new Error(`unknown step ${JSON.stringify(step)}`);
    }
    await settle(80);

    const marked = await page.evaluate(`(${readFileSync(here('boxes.js'), 'utf8')})()`);
    const png = join(out, `${screen.key}-${spec.orientation}.png`);
    writeFileSync(png, await page.screenshot({ clip: { x: 0, y: 0, width, height } }));
    if ((screen.seat ?? config.player ?? 0) !== 0) note('standalone: one seat only, so this is the first seat\'s screen, not the one the screen names');
    return { ok: true, png, width, height, ...marked, messages };
  } catch (e) {
    return { ok: false, reason: `standalone: ${e.message.split('\n')[0]}` };
  } finally {
    await browser?.close().catch(() => {});
  }
}
