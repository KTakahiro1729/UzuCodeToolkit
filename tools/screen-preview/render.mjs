// Draws one screen of a work in one orientation and says where its parts are (docs/qa-contract.md, 3;
// docs/screen-preview.md). Used by the check's shots and the slide comparison.
//
//   import { render } from './render.mjs';
//   const r = await render(workDir, { screen: '02-opening', orientation: 'landscape' });
//   // r.ok ? { png, width, height, em, boxes, messages } : { reason }
//
//   node tools/screen-preview/render.mjs <work dir> --screen 02-opening --orientation landscape --out dir [--size device] [--json]
//
// The renderer picks the way, not the caller: the dev harness (the work's `npm run harness`, started here
// unless HARNESS names one already running) or a standalone page (standalone.mjs, the SDK replaced by a
// stand-in; RENDER_WAY=standalone skips the harness). It never throws for a missing browser or a work that does not start: that is `ok: false`.
import { execFile, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const toolkitRoot = resolve(here, '../..');
const ORIENTATIONS = ['landscape', 'portrait'];
const SIZES = ['lower', 'device', 'wide', 'reference'];
const HARNESS_START_MS = 90_000;
const CAPTURE_MS = 180_000;

/** The shot list a work keeps, else a sample's own, else the toolkit's read-through list. */
function configFor(workDir) {
  return ['shots.mjs', 'preview.config.mjs'].map((f) => join(workDir, f)).find(existsSync)
    ?? join(toolkitRoot, 'packages/reader/preview.config.mjs');
}

/** The keys of the work's shots list, in order (what `render` can draw). */
export async function screens(workDir) {
  const config = (await import(pathToFileURL(configFor(resolve(workDir))).href)).default;
  return (config.screens ?? []).map((s) => (Array.isArray(s) ? s[0] : s.key));
}

/** Starts the work's harness and resolves with its URL and a function that stops it. */
function startHarness(workDir) {
  return new Promise((resolveStart, reject) => {
    const child = spawn('npm', ['run', 'harness'], { cwd: workDir, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let log = '';
    const stop = () => {
      try {
        if (process.platform === 'win32') spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' });
        else process.kill(-child.pid, 'SIGTERM');
      } catch { /* already gone */ }
    };
    const timer = setTimeout(() => { stop(); reject(new Error(`the harness did not start in ${HARNESS_START_MS / 1000} s`)); }, HARNESS_START_MS);
    const read = (d) => {
      log += d;
      const m = /UZU dev harness:\s*(http:\/\/\S+?)\/?\s/.exec(log);
      if (m) { clearTimeout(timer); resolveStart({ url: m[1], stop }); }
    };
    child.stdout.on('data', read);
    child.stderr.on('data', read);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('exit', (code) => { clearTimeout(timer); reject(new Error(`the harness exited (${code}): ${log.trim().split('\n').slice(-3).join(' | ')}`)); });
  });
}

/** capture.mjs plays the screen and writes the PNG and the boxes. */
function runCapture(workDir, { screen, orientation, size, out }, harnessUrl) {
  const boxesFile = join(out, `${screen}-${orientation}.boxes.json`);
  const args = [join(here, 'capture.mjs'), '--png', out, '--boxes', boxesFile, '--orient', orientation, '--only', screen,
    '--size', size, '--config', configFor(workDir), '--step-timeout', '20', workDir];
  return new Promise((resolveRun) => {
    execFile('node', args, { cwd: workDir, env: { ...process.env, HARNESS: harnessUrl }, timeout: CAPTURE_MS }, (error, stdout, stderr) => {
      resolveRun({ error, output: `${stdout}${stderr}`.trim(), boxesFile });
    });
  });
}

async function viaHarness(workDir, spec, out) {
  const given = process.env.HARNESS?.split(',')[0]?.trim();
  const harness = given ? { url: given, stop() {} } : await startHarness(workDir);
  try {
    const { error, output, boxesFile } = await runCapture(workDir, { ...spec, out }, harness.url);
    if (!existsSync(boxesFile)) return { ok: false, reason: `the screen could not be played: ${(error?.message ?? output).split('\n').slice(-3).join(' | ')}` };
    const { screens, messages } = JSON.parse(readFileSync(boxesFile, 'utf8'));
    rmSync(boxesFile);
    const keys = Object.keys(screens);
    const shot = keys.length === 1 ? screens[keys[0]][spec.orientation] : undefined;
    if (!shot) return { ok: false, reason: `no screen "${spec.screen}" in ${configFor(workDir)}${keys.length > 1 ? ' (it names more than one)' : ''}` };
    return { ok: true, png: join(out, `${keys[0]}-${spec.orientation}.png`), ...shot, messages };
  } finally {
    harness.stop();
  }
}

async function viaStandalone(workDir, spec, out) {
  const file = join(here, 'standalone.mjs');
  if (!existsSync(file)) return { ok: false, reason: 'the standalone way is not built yet' };
  const { renderStandalone } = await import(pathToFileURL(file).href);
  const r = await renderStandalone(workDir, spec, out, configFor(workDir));
  return r.ok ? { ...r, messages: ['standalone: the SDK is a stand-in', ...r.messages] } : r;
}

/**
 * @param {string} workDir
 * @param {{ screen: string, orientation: 'landscape' | 'portrait', size?: 'lower' | 'device' | 'wide' | 'reference', out?: string }} spec
 *   `out` is the folder for the image (default: a new one in the temp folder).
 */
export async function render(workDir, spec) {
  try {
    workDir = resolve(workDir);
    const { screen, orientation, size = 'device' } = spec ?? {};
    if (!screen) return { ok: false, reason: 'no screen named' };
    if (!ORIENTATIONS.includes(orientation)) return { ok: false, reason: `orientation is landscape or portrait, not ${orientation}` };
    if (!SIZES.includes(size)) return { ok: false, reason: `size is one of ${SIZES.join(', ')}, not ${size}` };
    if (!existsSync(join(workDir, 'manifest.json'))) return { ok: false, reason: `${workDir} is not a work (no manifest.json)` };
    const out = resolve(spec.out ?? mkdtempSync(join(tmpdir(), 'render-')));
    mkdirSync(out, { recursive: true });
    const full = { screen, orientation, size };
    let harnessReason = 'the harness was not used (RENDER_WAY=standalone)';
    if (process.env.RENDER_WAY !== 'standalone') try {
      const r = await viaHarness(workDir, full, out);
      // A harness that ran but could not play the screen is the answer; a harness that did not start tries the other way.
      if (r.ok || !/^the harness/.test(r.reason)) return r;
      harnessReason = r.reason;
    } catch (e) {
      harnessReason = e.message;
    }
    const r = await viaStandalone(workDir, full, out);
    return r.ok ? r : { ok: false, reason: `${harnessReason}; ${r.reason}` };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flag = (name) => {
    const i = args.indexOf(name);
    return i < 0 ? undefined : args.splice(i, 2)[1];
  };
  const json = args.includes('--json');
  const spec = { screen: flag('--screen'), orientation: flag('--orientation'), size: flag('--size'), out: flag('--out') };
  const [workDir] = args.filter((a) => a !== '--json');
  if (!workDir || !spec.screen || !spec.orientation) {
    console.error('usage: node tools/screen-preview/render.mjs <work dir> --screen <key> --orientation landscape|portrait [--size device] [--out dir] [--json]');
    process.exit(2);
  }
  const r = await render(workDir, spec);
  if (json) console.log(JSON.stringify(r, null, 2));
  else if (r.ok) {
    console.log(`${r.png}  ${r.width}×${r.height}  ${r.em}px/em  ${r.boxes.length} boxes`);
    r.messages.forEach((m) => console.log(`  ${m}`));
  } else console.error(`no shot: ${r.reason}`);
  process.exit(r.ok ? 0 : 1);
}
