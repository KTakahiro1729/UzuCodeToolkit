// Capture a sample's screens from a running UZU dev harness into one static HTML page with
// numbered parts, both orientations. Usage (harness running):
//   node tools/screen-preview/capture.mjs samples/<name> [out.html]
// With --check it writes no page and instead lists what spills over on each screen (overflow.js),
// exiting 1 if anything does.
// See docs/screen-preview.md.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const here = (f) => new URL(f, import.meta.url);
const HARNESS = process.env.HARNESS ?? 'http://localhost:10001';
const SIZES = { landscape: { width: 844, height: 390 }, portrait: { width: 390, height: 844 } };
const HUD = { x: 138, y: 52 }; // What the dev harness reports as the UZU HUD.

const args = process.argv.slice(2);
const check = args.includes('--check');
const [sample, out = join(tmpdir(), 'screen-preview.html')] = args.filter((a) => a !== '--check');
if (!sample) throw new Error('usage: node tools/screen-preview/capture.mjs [--check] samples/<name> [out.html]');
// The sample's own config, or the shared read-through one.
const configPath = [resolve(sample, 'preview.config.mjs'), resolve('packages/reader/preview.config.mjs')].find(existsSync);
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
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, reducedMotion: 'reduce' });
await page.goto(HARNESS);
await page.waitForTimeout(4000);
await page.evaluate(() => window.__uzu_dev?.reset?.({ seed: 'preview' }));
await page.waitForTimeout(1500);
const players = page.frames().filter((f) => f.parentFrame() === page.mainFrame());
const player = config.player ?? 0;
const target = players[player];
const seatName = JSON.parse(new URL(target.url()).searchParams.get('players') ?? '[]')[player]?.name ?? '';

/** Size the captured player's frame to a phone screen. */
const resize = (size) => page.evaluate(({ i, width, height }) => {
  const f = document.querySelectorAll('iframe')[i];
  f.parentElement.style.overflow = 'visible';
  f.parentElement.style.zIndex = 99;
  Object.assign(f.style, { width: width + 'px', height: height + 'px', right: 'auto', bottom: 'auto' });
}, { i: player, ...size });

/** Tap the next control n times (Infinity: until it is gone), in whichever player's screen has it. */
async function tap(n) {
  for (let i = 0; i < n; i++) {
    let tapped = false;
    for (const f of players) {
      const el = f.locator(config.next);
      if (await el.count()) { await el.first().evaluate((e) => e.click()); tapped = true; break; }
    }
    if (!tapped) return;
    await page.waitForTimeout(n === Infinity ? 150 : 500);
  }
}

const overflow = `(${readFileSync(here('overflow.js'), 'utf8')})()`;
let spills = 0;

const docs = {};
for (const s of config.screens) {
  await tap(s.taps ?? 0);
  await page.waitForTimeout(s.wait ?? 800);
  docs[s.key] = {};
  for (const [o, size] of Object.entries(SIZES)) {
    await resize(size);
    await page.waitForTimeout(800);
    if (check) {
      const found = await target.evaluate(overflow);
      spills += found.length;
      console.log(`${s.key} ${o}: ${found.length ? '' : 'ok'}`);
      for (const f of found) console.log(`  ${f.kind} ${f.side} ${f.by}px  ${f.path}  ${f.text}`);
      continue;
    }
    docs[s.key][o] = await snapshot(target, s.parts);
  }
  if (check) continue;
  // Numbers follow the config, so they stay put between captures; list only the parts on screen.
  const found = new Set(Object.keys(SIZES).flatMap((o) => docs[s.key][o].found));
  docs[s.key].parts = s.parts.map(([sel, label], i) => ({ n: i + 1, sel, label })).filter((p) => found.has(p.n));
}
await browser.close();
if (check) process.exit(spills ? 1 : 0);

const dirty = execSync('git status --porcelain').toString().trim() ? ' + local changes' : '';
const data = {
  title, player: seatName, commit: execSync('git rev-parse --short HEAD').toString().trim() + dirty,
  sizes: SIZES, strings: JSON.parse(readFileSync(here('strings.json'), 'utf8')),
  screens: config.screens.map(({ key, label }) => ({ key, label })), variants: config.variants ?? [], docs,
};
const page_ = readFileSync(here('page.html'), 'utf8')
  .replace('__TITLE__', () => data.strings.title.replace('{title}', title))
  .replace('__DATA__', () => JSON.stringify(data).replace(/<\//g, '<\\/'));
writeFileSync(out, page_);
console.log(`wrote ${out} (${Math.round(page_.length / 1024)} KB)`);
