// Capture a sample's screens from a running UZU dev harness, both orientations. Usage (harness running):
//   node tools/screen-preview/capture.mjs [--check] [--png <dir>] [--only <keys>] [--times] [--config <file>] [--size lower|device|wide|reference]
//     [--jobs <n>] [--step-timeout <s>] [--timeout <s>] samples/<name> [out.html]
// One pass over the screens does everything asked for. By default it writes one static HTML page with
// numbered parts. --check lists what spills over on each screen (overflow.js), exiting 1 if anything
// does. --png writes <key>-landscape.png and <key>-portrait.png for each screen into <dir>. The page is
// written when no mode is given or when out.html is; --check and --png alone write no page.
// --size picks the screen size: lower (780×360), device (844×390, the default), wide (1194×834) or reference (874×402, the design guide's).
// With --check, --size takes several, comma separated, or `all` (lower, device and wide: certification's three; and for a
// portrait work also `desktop`), and checks each in turn; the PNGs and the page are made at the first.
// --check looks only at the orientation the work's manifest.json fixes (`orientation`): the app holds a phone to it, so the
// other one is never played. `desktop` (1280×720, landscape) is the window of a PC, where a portrait work may be opened wide.
// `--orientation both|landscape|portrait`, or `orientation` in the config, overrides what --check looks at (a work that
// serves both says `both`).
// --only takes screen numbers or keys, comma separated (01,05): the other screens are skipped,
// steps included. A screen can run steps first (click, fill, set the state; in any seat's screen).
// A step that takes longer than --step-timeout (default 15 s), or a run longer than --timeout
// (default 600 s), stops and says which screen and step it was on.
// --jobs n plays independent runs of screens at the same time, each against a harness of its own
// (HARNESS lists their URLs, comma separated; missing ones are the last port + 1, + 2, ...).
// --boxes <file> writes, for each screen and orientation played, its size, px per em and the boxes of its marked parts
// (data-uzu-part, the three data-uzu-* marks) as JSON, with the page's console and network errors; --orient landscape|portrait
// plays only that orientation. Both are for tools/screen-preview/render.mjs.
// See docs/screen-preview.md.
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = (f) => new URL(f, import.meta.url);
// The screen sizes to capture, by name. `lower`, `device` (the default) and `wide` are certification's three
// (https://docs.code.uzu-app.com/certification); `reference` is the size UZU's design guide draws its layouts at
// (docs/screen-preview.md).
const SIZE_SETS = {
  lower: { landscape: { width: 780, height: 360 }, portrait: { width: 360, height: 780 } },
  device: { landscape: { width: 844, height: 390 }, portrait: { width: 390, height: 844 } },
  wide: { landscape: { width: 1194, height: 834 }, portrait: { width: 834, height: 1194 } },
  reference: { landscape: { width: 874, height: 402 }, portrait: { width: 402, height: 874 } },
  // A PC's window, whose shape is free: where a portrait work may be opened wide (it should hold a column in the middle).
  desktop: { landscape: { width: 1280, height: 720 } },
};
const HUD = { x: 138, y: 52 }; // What the dev harness reports as the UZU HUD.

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args.splice(i, 2)[1];
};
const check = args.includes('--check');
const showTimes = args.includes('--times');
const pngDir = flag('--png');
const JOBS = Math.max(1, Math.floor(Number(flag('--jobs') ?? 1)) || 1);
const configFile = flag('--config');
const boxesFile = flag('--boxes');
const orientOnly = flag('--orient');
const sizeArg = flag('--size') ?? 'device';
const orientationArg = flag('--orientation');

const only = flag('--only')?.split(',').map((k) => k.trim()).filter(Boolean);
const STEP_MS = Number(flag('--step-timeout') ?? 15) * 1000; // longest a step may take, and how long it waits for its element.
const TOTAL_MS = Number(flag('--timeout') ?? 600) * 1000; // longest the whole run may take.
const TIMEOUT = STEP_MS; // ms an element is waited for; a step as a whole may take half as long again.
const [sample, outArg] = args.filter((a) => a !== '--check' && a !== '--times');
if (!sample) throw new Error('usage: node tools/screen-preview/capture.mjs [--check] [--png <dir>] [--only <keys>] [--config <file>] [--size lower|device|wide|reference] [--jobs <n>] [--step-timeout <s>] [--timeout <s>] samples/<name> [out.html]');
const out = outArg ?? join(tmpdir(), 'screen-preview.html');
const wantPage = !!outArg || !(check || pngDir);

// The given config, the sample's own, or the shared read-through one.
const configPath = configFile
  ? resolve(configFile)
  : [resolve(sample, 'preview.config.mjs'), resolve('packages/reader/preview.config.mjs')].find(existsSync);
const config = (await import(pathToFileURL(configPath).href)).default;
const title = config.title ?? JSON.parse(readFileSync(resolve(sample, 'script/script.json'), 'utf8')).title;
// The orientation the work's manifest fixes (none: both are looked at).
const manifestOrientation = (() => {
  try {
    const o = JSON.parse(readFileSync(resolve(sample, 'manifest.json'), 'utf8')).orientation;
    return o === 'landscape' || o === 'portrait' ? o : undefined;
  } catch {
    return undefined;
  }
})();
// The flag wins, then the config's `orientation` (a work that serves both says `both` there), then the manifest.
const wanted = orientationArg ?? config.orientation;
if (wanted && !['both', 'landscape', 'portrait'].includes(wanted)) throw new Error('orientation takes both, landscape or portrait');
const checkOrientation = wanted ? (wanted === 'both' ? undefined : wanted) : manifestOrientation;
const sizeNames = sizeArg === 'all'
  ? ['lower', 'device', 'wide', ...(checkOrientation === 'portrait' ? ['desktop'] : [])]
  : sizeArg.split(',').map((n) => n.trim()).filter(Boolean);
for (const n of sizeNames) if (!SIZE_SETS[n]) throw new Error(`unknown --size ${n}: ${Object.keys(SIZE_SETS).join(', ')}, all`);
if (sizeNames.length > 1 && !check) throw new Error('--size with several sizes needs --check (a page or PNGs are made at one size)');
// The first size is the one the PNGs and the page are made at.
const SIZES = SIZE_SETS[sizeNames[0]];
// Playwright is not a dependency of the repo: use the one installed where this runs.
const { chromium } = createRequire(resolve('package.json'))('playwright');

// The same fonts and images come with every screen: fetch and encode each once.
const uris = new Map();
const dataUri = (url) => {
  const key = String(url);
  if (!uris.has(key)) {
    uris.set(key, (async () => {
      const res = await fetch(url);
      const type = res.headers.get('content-type');
      return `data:${type};base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`;
    })());
  }
  return uris.get(key);
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

// Time spent per kind of work, for --times (a step's time includes its settle and sync). With
// --jobs it adds up the workers' time, so it can exceed the total.
const spent = {};
const timed = (label, fn) => async (...a) => {
  const t = performance.now();
  try { return await fn(...a); } finally { spent[label] = (spent[label] ?? 0) + performance.now() - t; }
};
const t0 = performance.now();
let browser;
let failed = false;
const workers = [];
const fail = async (message, code, where = workers.map((w) => w.where).join(' | ')) => {
  if (failed) return;
  failed = true;
  console.error(`${message} (stopped at ${where || 'start'})`);
  await browser?.close().catch(() => {});
  process.exit(code);
};
const watchdog = setTimeout(() => fail(`timeout: the run took longer than ${TOTAL_MS / 1000} s`, 2), TOTAL_MS);
/** Fails with the current place if `fn` takes longer than ms. */
const within = (ms, what, fn) => {
  let timer;
  return Promise.race([
    fn(),
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`timeout: ${what} took longer than ${ms / 1000} s`)), ms); }),
  ]).finally(() => clearTimeout(timer));
};

// The screens to play, in runs. A screen with a `fresh` step (a state step that does not depend on
// the current state, such as a catalogue's `at` and `jump`) starts a new run: nothing before it
// matters, so a run can be played from a harness that has just been reset.
const picked = (s, i) => !only || only.some((k) => k === s.key || k === String(i + 1).padStart(2, '0') || s.key.startsWith(`${k}-`));
const isFresh = (st) => st.fresh === true || ('state' in st && typeof st.state !== 'function');
const freshAt = (s) => (s.steps ?? []).findLastIndex(isFresh);
const runs = [];
for (const [n, s] of config.screens.entries()) {
  if (!picked(s, n)) continue;
  if (!runs.length || freshAt(s) >= 0) runs.push([]);
  runs.at(-1).push(s);
}
// Runs go to the workers, the longest first to whoever has the least so far; each worker plays
// its runs in the order of the screens.
const weight = (run) => run.reduce((sum, s) => sum + 2 + (s.steps?.length ?? 0), 0);
const jobs = Math.min(JOBS, runs.length) || 1;
const plan = Array.from({ length: jobs }, () => ({ runs: [], load: 0 }));
for (const run of [...runs].sort((a, b) => weight(b) - weight(a))) {
  const w = plan.reduce((least, p) => (p.load < least.load ? p : least));
  w.runs.push(run);
  w.load += weight(run);
}
plan.forEach((p) => p.runs.sort((a, b) => config.screens.indexOf(a[0]) - config.screens.indexOf(b[0])));

// One harness for each worker: HARNESS lists their URLs; missing ones follow the last one's port.
const harnessUrls = (process.env.HARNESS ?? 'http://localhost:10001').split(',').map((u) => u.trim()).filter(Boolean);
while (harnessUrls.length < jobs) {
  const u = new URL(harnessUrls.at(-1));
  u.port = String(Number(u.port) + 1);
  harnessUrls.push(u.origin);
}
for (const u of harnessUrls.slice(0, jobs)) {
  await fetch(u).catch(() => {
    console.error(`no harness at ${u}${jobs > 1 ? ` (--jobs ${jobs} needs ${jobs}: ${harnessUrls.slice(0, jobs).join(', ')}; see docs/screen-preview.md)` : ''}`);
    process.exit(1);
  });
}

browser = await timed('browser launch', () => chromium.launch())();

const overflow = `(${readFileSync(here('overflow.js'), 'utf8')})()`;
// Why an element cannot be pressed as the screen stands (null if it can): it is
// missing, past the viewport, or covered or cut off (what is hit at its centre is not the element).
const reachable = (el) => {
  const r = el.getBoundingClientRect();
  if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) return 'past the viewport';
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
  return hit && el.contains(hit) ? null : 'covered or cut off';
};
const player = config.player ?? 0;
const markedBoxes = `(${readFileSync(here('boxes.js'), 'utf8')})()`; // for --boxes
const boxes = {};
const messages = [];
const note = (line) => { if (!messages.includes(line)) messages.push(line); };
const SEED = 20261113; // for the harness's random numbers (any number: what matters is that it is the same).
if (pngDir) mkdirSync(pngDir, { recursive: true });

/** A worker: a page on a harness of its own, playing its runs of screens. */
async function startWorker(HARNESS) {
  const w = { where: 'start' };
  workers.push(w);
  // PNGs are for people to look at: twice the pixels.
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: pngDir ? 2 : 1 });
  const page = await context.newPage();
  if (boxesFile) {
    page.on('console', (m) => m.type() === 'error' && note(`console: ${m.text()}`));
    page.on('pageerror', (e) => note(`page error: ${e.message}`));
    page.on('requestfailed', (r) => note(`request failed: ${r.url()}`));
    page.on('response', (r) => r.status() >= 400 && note(`${r.status()}: ${r.url()}`));
  }

/**
 * A seat's screen, looked up afresh each time: the harness may reload a player's frame (after a
 * reset or a resize), and a stale frame would make a step miss. A frame that was told to reload
 * (`window.__pvOld`) is not the new one until that mark is gone.
 */
async function seat(i) {
  for (const end = Date.now() + TIMEOUT; Date.now() < end; await page.waitForTimeout(50)) {
    const f = page.frames().find((f) => f.parentFrame() === page.mainFrame() && new URL(f.url()).searchParams.get('__dev_player') === String(i));
    if (f && (await f.evaluate(() => !window.__pvOld && !!document.querySelector('main')).catch(() => false))) return f;
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

/**
 * Waits until a seat's screen has stopped changing: fonts loaded, no DOM change for `quiet` ms
 * (at most `max`), and two frames drawn. This is what a fixed sleep stood for.
 */
const settle = timed('settle', (i, quiet = 120, max = 2000) => onSeat(i, (f) => f.evaluate(({ quiet, max }) => new Promise((resolve) => {
  let t;
  const done = () => { obs.disconnect(); clearTimeout(t); clearTimeout(cap); requestAnimationFrame(() => requestAnimationFrame(resolve)); };
  const arm = () => { clearTimeout(t); t = setTimeout(done, quiet); };
  const obs = new MutationObserver(arm);
  const cap = setTimeout(done, max);
  document.fonts.ready.then(() => {
    obs.observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
    arm();
  });
}), { quiet, max })));

/** Size a seat's frame to a phone screen, at the page's top left so the whole screen is in view. */
const resize = timed('resize', async (i, size) => {
  await page.evaluate(({ i, width, height }) => {
    // Put back any other seat sized before.
    document.querySelectorAll('iframe').forEach((f) => {
      for (const e of [f, f.parentElement]) if (e.dataset.pvStyle !== undefined) e.style.cssText = e.dataset.pvStyle;
    });
    const f = document.querySelectorAll('iframe')[i];
    for (const e of [f, f.parentElement]) e.dataset.pvStyle ??= e.style.cssText;
    Object.assign(f.parentElement.style, { overflow: 'visible', zIndex: 99, position: 'fixed', left: 0, top: 0, width: width + 'px', height: height + 'px' });
    Object.assign(f.style, { width: width + 'px', height: height + 'px', right: 'auto', bottom: 'auto' });
  }, { i, ...size });
  // The screen has the new size once the frame reports it; then two frames let it lay out.
  await onSeat(i, (f) => f.evaluate(({ width, height }) => new Promise((resolve) => {
    const ready = () => innerWidth === width && innerHeight === height;
    const frames = (n) => requestAnimationFrame(() => (n ? frames(n - 1) : resolve()));
    const poll = () => (ready() ? frames(1) : requestAnimationFrame(poll));
    poll();
  }), size));
});

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
/** After an action, one round trip to the harness: what it sent has been handled before the next step. */
const synced = timed('harness sync', () => admin('getRawState').catch(() => {}));

/** Tap the next control n times (Infinity: until it is gone), in whichever seat's screen has it. */
async function tap(n) {
  for (let i = 0; i < n; i++) {
    let tapped = -1;
    for (let p = 0; p < (await seatCount()) && tapped < 0; p++) {
      const did = await onSeat(p, async (f) => {
        const el = f.locator(config.next);
        if (!(await el.count())) return false;
        await el.first().evaluate((e) => e.click());
        return true;
      });
      if (did) tapped = p;
    }
    if (tapped < 0) return;
    await synced();
    await settle(tapped, 50);
  }
}

/** A screen's steps, each in its own seat's screen (default: the screen's seat). */
async function run(steps, screenSeat, key) {
  for (const [n, step] of steps.entries()) {
    const at = step.seat ?? screenSeat;
    w.where = `${key} step ${JSON.stringify(step, (_, v) => (typeof v === 'function' ? '[function]' : v === Infinity ? 'Infinity' : v))}`;
    await within(STEP_MS * 1.5, 'step', async () => {
      const target = (f, sel) => f.locator(sel).first();
      if ('tap' in step) await tap(step.tap);
      else if ('state' in step) {
        // An object replaces the state; a function gets the current state and returns the new one.
        const next = typeof step.state === 'function' ? step.state(await admin('getRawState')) : step.state;
        await admin('setRawState', [next]);
        await synced();
      } else if ('click' in step) {
        // A DOM click: the harness HUD sits over the screen and would catch a pointer click.
        await onSeat(at, async (f) => {
          const el = target(f, step.click);
          await el.waitFor({ state: 'visible', timeout: TIMEOUT });
          await el.evaluate((e) => e.click());
        });
        await synced();
      } else if ('fill' in step) await onSeat(at, (f) => target(f, step.fill).fill(step.text, { timeout: TIMEOUT }));
      else if ('reload' in step) {
        // A fresh screen from the current state: drops what earlier screens left in the page.
        await onSeat(at, (f) => f.evaluate(() => { window.__pvOld = true; location.reload(); }).catch(() => {}));
        await seat(at);
      } else if ('waitFor' in step) await onSeat(at, (f) => target(f, step.waitFor).waitFor({ state: 'visible', timeout: TIMEOUT }));
      else if (!('wait' in step)) throw new Error(`unknown step ${JSON.stringify(step)}`);
      // A step that gives a time waits that long (a real delay in the game); the others wait for
      // the screen to stop changing.
      // A next step that waits for its own element (click, fill, waitFor) needs no settle here; the
      // screen's last step is settled by the caller.
      const next = steps[n + 1];
      if (step.wait !== undefined) await page.waitForTimeout(step.wait);
      else if (next && !('click' in next || 'fill' in next || 'waitFor' in next)) await settle(at, 50);
    });
  }
}

  /**
   * The game from its start with the random numbers from the same place, so a run of screens deals
   * the same cards wherever it is played (the harness ignores a seed that is not a number), and the
   * seats' frames back at their grid size, as a freshly loaded page has them.
   */
  const restart = async () => {
    await page.evaluate((seed) => window.__uzu_dev?.reset?.({ seed }), SEED);
    await synced();
    await page.evaluate(() => document.querySelectorAll('iframe').forEach((f) => {
      for (const e of [f, f.parentElement]) if (e.dataset.pvStyle !== undefined) e.style.cssText = e.dataset.pvStyle;
    }));
    // The reset reloads the screens: wait for every seat to have one again.
    for (let i = 0; i < (await seatCount()); i++) await seat(i);
  };
  w.where = 'harness start';
  await within(STEP_MS * 2, 'the harness start', async () => {
    await page.goto(HARNESS);
    await page.waitForFunction(() => window.__uzu_dev, null, { timeout: STEP_MS });
    await page.waitForFunction(() => document.querySelectorAll('iframe').length > 0, null, { timeout: STEP_MS });
    await restart();
  });

  w.seatName = async (i) => JSON.parse(new URL((await seat(i)).url()).searchParams.get('players') ?? '[]')[i]?.name ?? '';

  /** Plays one screen (from a run's start when `head`, which drops what a fresh step makes moot); returns its outputs. */
  w.play = async (s, head, first) => {
    const at = s.seat ?? player;
    const t1 = performance.now();
    const lines = [];
    let spills = 0;
    let steps = s.steps ?? [];
    let taps = s.taps ?? 0;
    // A run that starts fresh starts from the game's start, whichever screens were played before it.
    if (head && !first && freshAt(s) >= 0) {
      w.where = `${s.key} restart`;
      await within(STEP_MS * 2, 'the restart', restart);
    }
    if (head && freshAt(s) >= 0) {
      steps = steps.slice(freshAt(s));
      taps = 0;
    }
    w.where = `${s.key} taps`;
    await within(STEP_MS * 3, 'the taps', () => tap(taps));
    await timed('steps', run)(steps, at, s.key);
    // `wait` on a screen is a real delay (a timer in the game); otherwise wait for the screen to be still.
    if (s.wait !== undefined) await page.waitForTimeout(s.wait);
    else await settle(at, 80);
    const doc = {};
    // One pass: each orientation gives the overflow check, the PNG and the snapshot. With several
    // sizes (--check), the later sizes only check.
    for (const [si, sizeName] of sizeNames.entries())
    for (const [o, size] of Object.entries(SIZE_SETS[sizeName])) {
      const first = si === 0;
      // A check looks only at the work's own orientation (the PC window is the exception: it is wide whatever the work is).
      if (orientOnly && o !== orientOnly) continue;
      if (check && !(pngDir || wantPage) && checkOrientation && sizeName !== 'desktop' && o !== checkOrientation) continue;
      const tag = sizeNames.length > 1 ? `${sizeName} ${o}` : o;
      w.where = `${s.key} ${tag}`;
      await within(STEP_MS * 3, `${s.key} ${tag}`, async () => {
        await resize(at, size);
        if (check) {
          const found = await timed('check', onSeat)(at, (f) => f.evaluate(overflow));
          // Only what hinders play fails the check; a small cut-off of a label is listed as a warning.
          const errors = found.filter((f) => f.severity !== 'warn');
          spills += errors.length;
          lines.push(`${s.key} ${tag}: ${found.length ? '' : 'ok'}`);
          for (const f of found) lines.push(`  ${f.severity === 'warn' ? 'warn ' : ''}${f.kind} ${f.side} ${f.by}px  ${f.path}  ${f.text}`);
          // The screen's `reach` selectors (the action to press now) must be on screen without scrolling.
          for (const sel of s.reach ?? []) {
            const why = await onSeat(at, async (f) => {
              const el = f.locator(sel).first();
              return (await el.count()) ? el.evaluate(reachable) : 'not on the screen';
            });
            if (why) { spills++; lines.push(`  unreachable ${sel}: ${why}`); }
          }
        }
        if (pngDir && first) {
          const file = join(pngDir, `${s.key}-${o}.png`);
          await timed('png', page.screenshot.bind(page))({ path: file, clip: { x: 0, y: 0, ...size } });
          lines.push(`wrote ${file}`);
        }
        if (boxesFile && first) {
          const m = await timed('boxes', onSeat)(at, (f) => f.evaluate(markedBoxes));
          (boxes[s.key] ??= {})[o] = { width: size.width, height: size.height, ...m };
        }
        if (wantPage && first) doc[o] = await timed('snapshot', onSeat)(at, (f) => snapshot(f, s.parts ?? []));
      });
    }
    if (wantPage) {
      // Numbers follow the config, so they stay put between captures; list only the parts on screen.
      const found = new Set(Object.keys(SIZES).flatMap((o) => doc[o].found));
      doc.parts = (s.parts ?? []).map(([sel, label], i) => ({ n: i + 1, sel, label })).filter((p) => found.has(p.n));
    }
    return { key: s.key, doc, lines, spills, ms: Math.round(performance.now() - t1) };
  };
  return w;
}

const results = new Map();
let spills = 0;
try {
  await Promise.all(plan.map(async (p, i) => {
    const w = await startWorker(harnessUrls[i]);
    for (const [ri, run] of p.runs.entries()) {
      for (const [k, s] of run.entries()) {
        const r = await w.play(s, k === 0, i === 0 && ri === 0);
        results.set(s.key, r);
        // A single worker reports as it goes.
        if (jobs === 1) r.lines.forEach((l) => console.log(l));
      }
    }
  }));
} catch (e) {
  await fail(e.message, 1);
}
clearTimeout(watchdog);
// In the order of the screens, whichever worker played them.
const played = config.screens.filter(({ key }) => results.has(key)).map(({ key }) => results.get(key));
if (jobs > 1) played.forEach((r) => r.lines.forEach((l) => console.log(l)));
spills = played.reduce((sum, r) => sum + r.spills, 0);
const docs = Object.fromEntries(played.map((r) => [r.key, r.doc]));
const perScreen = played.map((r) => `${r.key.slice(0, 2)} ${r.ms}`);
const name = wantPage ? await workers[0].seatName(player) : '';
const total = performance.now() - t0;
if (showTimes) {
  console.log(`per screen (ms): ${perScreen.join(', ')}`);
  console.log(`times (ms; a step includes its settle and sync): ${Object.entries(spent).map(([k, v]) => `${k} ${Math.round(v)}`).join(', ')}, total ${Math.round(total)}, jobs ${jobs}`);
}
await browser.close();
if (boxesFile) writeFileSync(boxesFile, JSON.stringify({ screens: boxes, messages }));
if (!wantPage) process.exit(check && spills ? 1 : 0);

const dirty = execSync('git status --porcelain').toString().trim() ? ' + local changes' : '';
const data = {
  title, player: name, commit: execSync('git rev-parse --short HEAD').toString().trim() + dirty,
  sizes: SIZES, strings: JSON.parse(readFileSync(here('strings.json'), 'utf8')),
  screens: config.screens.filter(({ key }, n) => key in docs).map(({ key, label }) => ({ key, label })), variants: config.variants ?? [], docs,
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
