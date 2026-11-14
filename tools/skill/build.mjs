// Builds the ChatGPT Skill: dist/uzu-work-maker.zip (one top-level folder, SKILL.md inside; the format the
// OpenAI Skills docs ask for, docs/decisions/2026-11-14-the-chatgpt-skill-is-built-from-the-docs.md).
// The procedure's text is not copied into git: the docs are put into references/ here, so they never differ.
// Usage: node tools/skill/build.mjs [out.zip]
import { cpSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = fileURLToPath(new URL('../..', import.meta.url));
export const NAME = 'uzu-work-maker';
/** What goes into references/, as [source in the repository, name there]. */
const REFERENCES = [
  ['docs/new-work.md', 'new-work.md'],
  ['docs/plan-to-parts.md', 'plan-to-parts.md'],
  ['docs/design/layout.md', 'layout.md'],
  ['packages/toolkit/README.md', 'toolkit-README.md'],
  ['packages/reader/src/layouts/read-through.layout.json', 'read-through.layout.json'],
];

export async function buildSkill(out = resolve(root, 'dist', `${NAME}.zip`)) {
  const stage = mkdtempSync(join(tmpdir(), 'skill-'));
  try {
    const dir = join(stage, NAME);
    cpSync(join(root, 'skill', NAME), dir, { recursive: true });
    mkdirSync(join(dir, 'references'), { recursive: true });
    for (const [from, to] of REFERENCES) cpSync(join(root, from), join(dir, 'references', to));
    const zip = new JSZip();
    const walk = (d) => {
      for (const n of readdirSync(d).sort()) {
        const f = join(d, n);
        if (statSync(f).isDirectory()) walk(f);
        else zip.file(relative(stage, f).split('\\').join('/'), readFileSync(f), { date: new Date(0) });
      }
    };
    walk(dir);
    mkdirSync(resolve(out, '..'), { recursive: true });
    writeFileSync(out, await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }));
    return out;
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log('wrote', await buildSkill(process.argv[2] && resolve(process.argv[2])));
