// The check command (docs/qa-contract.md, 1): every static check, then the screens as images when a browser is there.
//   node tools/check/index.mjs <work folder> [--allow rule,rule] [--out dir] [--shots auto|none]
// Prints ERRORS, WARNINGS, NEXT and SHOTS, and writes the same to <out>/report.json (default <work>/check-out).
// Exits 1 on any error. A missing browser or a failed screen never stops it and never changes the exit code.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkWork, format } from './static.mjs';

/** The screens as images, or `{ mode: 'none', reason }`. Uses tools/screen-preview/render.mjs when it is there. */
async function takeShots(dir, out) {
  let render;
  try {
    render = await import('../screen-preview/render.mjs');
  } catch (e) {
    return { mode: 'none', reason: `screen renderer not available (${String(e.message).split('\n')[0]})`, files: [] };
  }
  try {
    const keys = await render.screens(dir);
    const manifest = await import('node:fs').then((fs) => JSON.parse(fs.readFileSync(join(dir, 'manifest.json'), 'utf8')));
    const orientations = ['landscape', 'portrait'].filter((o) => !manifest.orientation || manifest.orientation === 'both' || manifest.orientation === o);
    const files = [];
    const reasons = new Set();
    mkdirSync(join(out, 'shots'), { recursive: true });
    for (const key of keys)
      for (const orientation of orientations) {
        const r = await render.render(dir, { screen: key, orientation, out: join(out, 'shots') });
        if (r.ok) files.push({ key, label: r.label ?? key, orientation, path: relative(dir, r.png) });
        else reasons.add(r.reason);
      }
    if (!files.length) return { mode: 'none', reason: [...reasons][0] ?? 'no screens', files };
    return { mode: 'browser', files, ...(reasons.size ? { reason: `some screens not drawn: ${[...reasons].join('; ')}` } : {}) };
  } catch (e) {
    return { mode: 'none', reason: String(e.message).split('\n')[0], files: [] };
  }
}

/** The report for a work; the command prints and writes it. */
export async function runCheck(dir, { allow = [], out, shots = 'auto' } = {}) {
  dir = resolve(dir);
  out = resolve(out ?? join(dir, 'check-out'));
  const { errors, warnings } = checkWork(dir, { allow });
  const next = [...new Set([...errors, ...warnings].filter((f) => f.fix).map((f) => f.fix))];
  mkdirSync(out, { recursive: true });
  const shot = shots === 'none' ? { mode: 'none', reason: 'switched off with --shots none', files: [] } : await takeShots(dir, out);
  const report = { ok: errors.length === 0, errors, warnings, next, shots: shot };
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));
  return report;
}

export function printReport(r, log = console.log) {
  log(`ERRORS   (${r.errors.length})`);
  for (const f of r.errors) log(`  ${format(f)}`);
  log(`WARNINGS (${r.warnings.length})`);
  for (const f of r.warnings) log(`  ${format(f)}`);
  log('NEXT');
  for (const n of r.next) log(`  ${n}`);
  if (!r.next.length) log('  (nothing)');
  log('SHOTS');
  if (r.shots.mode === 'none') log(`  none (${r.shots.reason})`);
  else {
    for (const s of r.shots.files) log(`  ${s.key}  ${s.orientation}  ${s.path}`);
    if (r.shots.reason) log(`  (${r.shots.reason})`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const take = (flag) => {
    const at = args.indexOf(flag);
    return at < 0 ? undefined : args.splice(at, 2)[1];
  };
  const allow = (take('--allow') ?? '').split(',').filter(Boolean);
  const out = take('--out');
  const shots = take('--shots') ?? 'auto';
  const dir = args[0];
  if (!dir) throw new Error('usage: node tools/check/index.mjs <work folder> [--allow rule,rule] [--out dir] [--shots auto|none]');
  const report = await runCheck(dir, { allow, out, shots });
  printReport(report);
  process.exit(report.ok ? 0 : 1);
}
