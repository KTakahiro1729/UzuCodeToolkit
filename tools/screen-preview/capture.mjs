// Capture a sample's screens from a running UZU dev harness, both orientations. Usage (harness running):
//   node tools/screen-preview/capture.mjs [--check | --png <dir>] [--config <file>] samples/<name> [out.html]
// By default it writes one static HTML page with numbered parts. With --check it writes no page and
// instead lists what spills over on each screen (overflow.js), exiting 1 if anything does. With
// --png it writes <key>-landscape.png and <key>-portrait.png for each screen into <dir>.
// A screen can run steps first (click, fill, set the state; in any seat's screen).
// See docs/screen-preview.md.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = (f) => new URL(f, import.meta.url);
const HARNESS = process.env.HARNESS ?? 'http://localhost:10001';
const SIZES = { landscape: { width: 844, height: 390 }, portrait: { width: 390, height: 844 } };
const HUD = { x: 138, y: 52 }; // What the dev harness reports as the UZU HUD.
const TIMEOUT = 10000; // ms a step waits for its element.

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args.splice(i, 2)[1];
};
const check = args.includes('--check');
const pngDir = flag('--png');
const configFile = flag('--config');
const [sample, out = join(tmpdir(), 'screen-preview.html')] = args.filter((a) => a !== '--check');
if (!sample) throw new Error('usage: node tools/screen-preview/capture.mjs [--check | --png <dir>] [--config <file>] samples/<name> [out.html]');
// The given config, the sample's own, or the shared read-through one.
const configPath = configFile
  ? resolve(configFile)
  : [resolve(sample, 'preview.config.mjs'), resolve('packages/reader/preview.config.mjs')].find(existsSync);
const config = (await import(pathToFileURL(configPath).href)).default;
const title = config.title ?? JSON.parse(readFileSync(resolve(sample, 'script/script.json'), 'utf8')).title;
// Playwright is not a dependency of the repo: use the one installed where this runs.
const { chromium } = createRequire(resolve('package.json'))('playwright');

const dataUri = async (url) => {
  const res = await fetch(url);
  const type = res.headers.get('content-type');
  return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
};

/** The frame's DOM, CSS and part measurements, with fonts and images inlined. */
async function snapshot(frame, parts) {
  const snap = await frame.evaluate(({ parts, scroll }) => {
    document.querySelectorAll('[data-n],[data-pv-scroll]').forEach((e) => {
      delete e.dataset.n;
      delete e.dataset.pvScroll;
    });
    scroll.forEach((sel) => document.querySelectorAll(sel).forEach((e) => (e.dataset.pvScroll = '')));
    const found = [];
    // On screen: shown, inside the viewport and not scrolled out of a list.
    const visible = (el) => {
      const r = el.getBoundingClientRect();
      if (!r.width && !r.height) return false;
      const st = getComputedStyle(el);
      if (st.visibility === 'hidden' || st.opacity === '0') return false;
      for (let a = el.parentElement; a; a = a.parentElement) {
        if (getComputedStyle(a).overflowY === 'visible') continue;
        const b = a.getBoundingClientRect();
        if (r.bottom <= b.top || r.top >= b.bottom) return false;
      }
      return r.bottom > 0 && r.top < innerHeight;
    };
    parts.forEach(([sel], i) => {
      const el = [...document.querySelectorAll(sel)].filter(visible).pop();
      if (el) {
        el.dataset.n = i + 1;
        found.push(i + 1);
      }
    });
    const css = [...document.styleSheets]
      .map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join('\n'); } catch { return ''; } })
      .join('\n');
    const body = document.body.cloneNode(true);
    body.querySelectorAll('script').forEach((e) => e.remove());
    return {
      base: parseFloat(getComputedStyle(document.querySelector('main') ?? document.body).fontSize),
      found, css, rootStyle: document.documentElement.getAttribute('style') ?? '', body: body.innerHTML, href: location.href,
    };
  }, { parts, scroll: config.scroll ?? [] });
  for (const u of new Set([...snap.css.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:'))))
    snap.css = snap.css.split(u).join(await dataUri(new URL(u, snap.href)));
  for (const u of new Set([...snap.body.matchAll(/src="([^"]+)"/g)].map((m) => m[1]).filter((u) => !u.startsWith('data:'))))
    snap.body = snap.body.split(`src="${u}"`).join(`src="${await dataUri(new URL(u, snap.href))}"`);
  const overlay = `<style>${readFileSync(here('overlay.css'), 'utf8')}</style><!--PV-VARIANT-->`;
  const script = `const HUD=${JSON.stringify(HUD)};${readFileSync(here('overlay.js'), 'utf8')}`;
  const html = `<!doctype html><html lang="ja" style="${snap.rootStyle.replace(/"/g, '&quot;')}"><head><meta charset="utf-8">`
    + `<style>${snap.css}</style>${overlay}</head><body>${snap.body}<script>${script}<\/script></body></html>`;
  return { html, base: snap.base, found: snap.found };
}

const browser = await chromium.launch();
// PNGs are for people to look at: twice the pixels.
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: pngDir ? 2 : 1 });
await page.goto(HARNESS);
await page.waitForTimeout(4000);
await page.evaluate(() => window.__uzu_dev?.reset?.({ seed: 'preview' }));
await page.waitForTimeout(1500);

/**
 * A seat's screen, looked up afresh each time: the harness may reload a player's frame (after a
 * reset or a resize), and a stale frame would make a step miss.
 */
async function seat(i) {
  for (const end = Date.now() + TIMEOUT; Date.now() < end; await page.waitForTimeout(100)) {
    const f = page.frames().find((f) => f.parentFrame() === page.mainFrame() && new URL(f.url()).searchParams.get('__dev_player') === String(i));
    if (f && (await f.locator('main').count().catch(() => 0))) return f;
  }
  throw new Error(`seat ${i}: no screen`);
}
const seatCount = () => page.evaluate(() => document.querySelectorAll('iframe').length);

/** Run fn on a seat's screen, again on a fresh frame if the frame reloads under it. */
async function onSeat(i, fn) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(await seat(i));
    } catch (e) {
      if (attempt >= 2 || !/detached|destroyed|navigat/i.test(e.message)) throw e;
    }
  }
}

/** Size a seat's frame to a phone screen, at the page's top left so the whole screen is in view. */
const resize = (i, size) => page.evaluate(({ i, width, height }) => {
  // Put back any other seat sized before.
  document.querySelectorAll('iframe').forEach((f) => {
    for (const e of [f, f.parentElement]) if (e.dataset.pvStyle !== undefined) e.style.cssText = e.dataset.pvStyle;
  });
  const f = document.querySelectorAll('iframe')[i];
  for (const e of [f, f.parentElement]) e.dataset.pvStyle ??= e.style.cssText;
  Object.assign(f.parentElement.style, { overflow: 'visible', zIndex: 99, position: 'fixed', left: 0, top: 0, width: width + 'px', height: height + 'px' });
  Object.assign(f.style, { width: width + 'px', height: height + 'px', right: 'auto', bottom: 'auto' });
}, { i, ...size });

/** Tap the next control n times (Infinity: until it is gone), in whichever seat's screen has it. */
async function tap(n) {
  for (let i = 0; i < n; i++) {
    let tapped = false;
    for (let p = 0; p < (await seatCount()) && !tapped; p++) {
      tapped = await onSeat(p, async (f) => {
        const el = f.locator(config.next);
        if (!(await el.count())) return false;
        await el.first().evaluate((e) => e.click());
        return true;
      });
    }
    if (!tapped) return;
    await page.waitForTimeout(n === Infinity ? 150 : 500);
  }
}

/** One call to the harness admin channel (the one window.__uzu_dev uses). */
function admin(method, args = []) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(HARNESS.replace(/^http/, 'ws') + '/dev/admin');
    ws.onopen = () => ws.send(JSON.stringify({ type: 'call', id: 'capture', method, args }));
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id !== 'capture') return;
      ws.close();
      msg.type === 'error' ? reject(new Error(`${method}: ${msg.error}`)) : resolve(msg.value);
    };
    ws.onerror = () => reject(new Error(`${method}: admin channel error`));
  });
}

/** A screen's steps, each in its own seat's screen (default: the screen's seat). */
async function run(steps, screenSeat) {
  for (const step of steps) {
    const at = step.seat ?? screenSeat;
    const target = (f, sel) => f.locator(sel).first();
    if ('tap' in step) await tap(step.tap);
    else if ('state' in step) {
      // An object replaces the state; a function gets the current state and returns the new one.
      const next = typeof step.state === 'function' ? step.state(await admin('getRawState')) : step.state;
      await admin('setRawState', [next]);
    } else if ('click' in step) {
      // A DOM click: the harness HUD sits over the screen and would catch a pointer click.
      await onSeat(at, async (f) => {
        const el = target(f, step.click);
        await el.waitFor({ state: 'visible', timeout: TIMEOUT });
        await el.evaluate((e) => e.click());
      });
    } else if ('fill' in step) await onSeat(at, (f) => target(f, step.fill).fill(step.text, { timeout: TIMEOUT }));
    else if ('reload' in step) {
      // A fresh screen from the current state: drops what earlier screens left in the page.
      await onSeat(at, (f) => f.evaluate(() => location.reload()).catch(() => {}));
      await page.waitForTimeout(1500);
      await seat(at);
    } else if ('waitFor' in step) await onSeat(at, (f) => target(f, step.waitFor).waitFor({ state: 'visible', timeout: TIMEOUT }));
    else if (!('wait' in step)) throw new Error(`unknown step ${JSON.stringify(step)}`);
    await page.waitForTimeout(step.wait ?? 300);
  }
}

const seatName = async (i) => JSON.parse(new URL((await seat(i)).url()).searchParams.get('players') ?? '[]')[i]?.name ?? '';
const player = config.player ?? 0;
if (pngDir) mkdirSync(pngDir, { recursive: true });

const overflow = `(${readFileSync(here('overflow.js'), 'utf8')})()`;
let spills = 0;
// Why an element cannot be pressed as the screen stands (null if it can): it is
// missing, past the viewport, or covered or cut off (what is hit at its centre is not the element).
const reachable = (el) => {
  const r = el.getBoundingClientRect();
  if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return 'past the viewport';
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return hit && el.contains(hit) ? null : 'covered or cut off';
};

const docs = {};
for (const s of config.screens) {
  const at = s.seat ?? player;
  await tap(s.taps ?? 0);
  await run(s.steps ?? [], at);
  await page.waitForTimeout(s.wait ?? 800);
  docs[s.key] = {};
  for (const [o, size] of Object.entries(SIZES)) {
    await resize(at, size);
    await page.waitForTimeout(800);
    if (check) {
      const found = await onSeat(at, (f) => f.evaluate(overflow));
      spills += found.length;
      console.log(`${s.key} ${o}: ${found.length ? '' : 'ok'}`);
      for (const f of found) console.log(`  ${f.kind} ${f.side} ${f.by}px  ${f.path}  ${f.text}`);
      // The screen's `reach` selectors (the action to press now) must be on screen without scrolling.
      for (const sel of s.reach ?? []) {
        const why = await onSeat(at, async (f) => {
          const el = f.locator(sel).first();
          return (await el.count()) ? el.evaluate(reachable) : 'not on the screen';
        });
        if (why) { spills++; console.log(`  unreachable ${sel}: ${why}`); }
      }
      continue;
    }
    if (pngDir) {
      const file = join(pngDir, `${s.key}-${o}.png`);
      await seat(at);
      await page.screenshot({ path: file, clip: { x: 0, y: 0, ...size } });
      console.log(`wrote ${file}`);
      continue;
    }
    docs[s.key][o] = await onSeat(at, (f) => snapshot(f, s.parts ?? []));
  }
  if (check || pngDir) continue;
  // Numbers follow the config, so they stay put between captures; list only the parts on screen.
  const found = new Set(Object.keys(SIZES).flatMap((o) => docs[s.key][o].found));
  docs[s.key].parts = (s.parts ?? []).map(([sel, label], i) => ({ n: i + 1, sel, label })).filter((p) => found.has(p.n));
}
const name = await seatName(player);
await browser.close();
if (check) process.exit(spills ? 1 : 0);
if (pngDir) process.exit(0);

const dirty = execSync('git status --porcelain').toString().trim() ? ' + local changes' : '';
const data = {
  title, player: name, commit: execSync('git rev-parse --short HEAD').toString().trim() + dirty,
  sizes: SIZES, strings: JSON.parse(readFileSync(here('strings.json'), 'utf8')),
  screens: config.screens.map(({ key, label }) => ({ key, label })), variants: config.variants ?? [], docs,
};
// Each screen carries its fonts and images inline; keep every large one once and put a token
// where it was, which page.html swaps back in (a work's fonts would otherwise repeat per screen).
const shared = [];
const json = JSON.stringify(data).replace(/data:[a-z0-9+/.-]+;base64,[A-Za-z0-9+/=]{20000,}/g, (uri) => {
  let i = shared.indexOf(uri);
  if (i < 0) i = shared.push(uri) - 1;
  return `{{uri:${i}}}`;
});
const page_ = readFileSync(here('page.html'), 'utf8')
  .replace('__TITLE__', () => data.strings.title.replace('{title}', title))
  .replace('__SHARED__', () => JSON.stringify(shared))
  .replace('__DATA__', () => json.replace(/<\//g, '<\\/'));
writeFileSync(out, page_);
console.log(`wrote ${out} (${Math.round(page_.length / 1024)} KB)`);
