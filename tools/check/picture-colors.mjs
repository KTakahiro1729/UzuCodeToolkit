// The text colour against the pictures it is drawn on (docs/new-work.md, "Pictures"), measured from the pixels.
//   picture-contrast  (error)  the mean colour of a frame, plate or panel picture is under 4.5:1 with the text colour
//                              drawn on it (`--color-text`; `--color-mine-text` on a `-mine` picture): dark text on a dark frame.
//   picture-contrast-skipped  (warning)  python3 with Pillow is not there, so no picture was measured.
// The mean of the picture's middle is a rough measure: a picture that is dark only at its edge passes, a textured one may fail.
// A work that means it says `--allow picture-contrast` (static.mjs).
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_LAYOUT } from '../layout/brief/brief.mjs';
import { ratio } from './look.mjs';

/** Picture -> the text token drawn on it (StageReadThrough.svelte). */
const ON = { frame: '--color-text', 'frame-mine': '--color-mine-text', plate: '--color-text', 'plate-mine': '--color-mine-text', panel: '--color-text' };
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** A token's #rrggbb from the work's theme.css, else the toolkit's. */
function token(dir, name) {
  const files = [join(dir, 'src', 'theme.css'), join(dirname(DEFAULT_LAYOUT), '..', 'theme.css')];
  for (const f of files) {
    const v = existsSync(f) && new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\b`).exec(readFileSync(f, 'utf8'))?.[1];
    if (v) return v;
  }
}

/** Findings as [list, rule, message]. */
export function checkPictureColors(dir) {
  const assets = join(dir, 'public', 'assets');
  const files = Object.keys(ON).map((n) => join(assets, `${n}.webp`)).filter(existsSync);
  if (!files.length) return [];
  const run = spawnSync('python3', [fileURLToPath(new URL('colors.py', import.meta.url)), ...files], { encoding: 'utf8' });
  if (run.status !== 0) return [['warnings', 'picture-contrast-skipped', 'python3 with Pillow is not available, so the text colour was not measured against the pictures (pip install pillow). Look at the check pictures and say so in the report.']];
  const mean = JSON.parse(run.stdout);
  const out = [];
  for (const [name, rgb] of Object.entries(mean)) {
    const text = token(dir, ON[name]);
    if (!text) continue;
    const r = ratio(text, hex(rgb));
    if (r < 4.5)
      out.push(['errors', 'picture-contrast', `${name}.webp averages ${hex(rgb)} where text sits; ${ON[name]} ${text} on it is ${r.toFixed(2)}:1, and text needs 4.5:1. Make the picture lighter or darker, or change the text colour in src/theme.css.`]);
  }
  return out;
}
