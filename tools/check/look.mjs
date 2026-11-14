// Checks of how a work looks that no one sees when an agent builds it (docs/new-work.md, "Pictures"):
//   layout-changed         (warning)  the work's own layout JSON moves or resizes a box of the toolkit's (the guide's) layout.
//   theme-contrast         (warning)  a text colour of src/theme.css against the surface it sits on is under 4.5:1 (WCAG AA).
// Reads only the work's files; no image library.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LAYOUT } from '../layout/brief/brief.mjs';

const luminance = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/** Text colour token, surface token: what the stage and the screens draw as text on a token surface. */
const PAIRS = [
  ['--color-text', '--color-bubble'],
  ['--color-text-quiet', '--color-bubble'],
  ['--color-text', '--color-bg'],
  ['--color-mine-text', '--color-mine-current'],
];

/** Findings as [list, rule, message, file]. */
export function checkLook(dir) {
  const out = [];
  // layout-changed
  const own = existsSync(join(dir, 'src')) ? readdirSync(join(dir, 'src')).filter((n) => n.endsWith('.layout.json')) : [];
  if (own.length === 1) {
    const mine = JSON.parse(readFileSync(join(dir, 'src', own[0]), 'utf8'));
    const base = JSON.parse(readFileSync(DEFAULT_LAYOUT, 'utf8'));
    const moved = [];
    for (const [id, part] of Object.entries(mine.parts ?? {}))
      for (const o of ['landscape', 'portrait']) {
        const was = base.parts[id]?.[o];
        if (part[o] && was && JSON.stringify(part[o]) !== JSON.stringify(was)) moved.push(`${id} (${o}) ${JSON.stringify(was)} -> ${JSON.stringify(part[o])}`);
      }
    if (moved.length)
      out.push(['warnings', 'layout-changed', `src/${own[0]} moves or resizes the guide's boxes: ${moved.join('; ')}. Keep the guide's arrangement unless the author asked for another (through the slides, docs/new-work.md); if you changed it, say which boxes and why in the report.`, `src/${own[0]}`]);
  }
  // theme-contrast
  const theme = join(dir, 'src', 'theme.css');
  if (existsSync(theme)) {
    const css = readFileSync(theme, 'utf8');
    const token = (name) => new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})\\b`).exec(css)?.[1];
    for (const [fg, bg] of PAIRS) {
      const a = token(fg);
      const b = token(bg);
      if (a && b && ratio(a, b) < 4.5)
        out.push(['warnings', 'theme-contrast', `${fg} ${a} on ${bg} ${b} is ${ratio(a, b).toFixed(1)}:1; text needs 4.5:1 (WCAG AA).`, 'src/theme.css']);
    }
  }
  return out;
}
