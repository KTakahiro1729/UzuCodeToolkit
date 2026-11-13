// The bundled font subsets must hold every glyph the work shows (rebuild with `npm run fonts`).
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { collectGlyphs, missingGlyphs } from '../../../tools/fonts/fonts.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));

it('font subsets hold every glyph the work shows', () => {
  expect(missingGlyphs(root)).toEqual({ story: [], ui: [] });
});

// The check is only worth having if it fails when a glyph is missing, so test it once here.
it('reports a glyph that the subsets lack', () => {
  const dir = mkdtempSync(join(tmpdir(), 'fonts-check-'));
  try {
    const config = {
      out: join(root, 'src/fonts'),
      story: [{ chars: '龘' }],
      ui: [{ chars: '鬱' }],
    };
    writeFileSync(join(dir, 'fonts.config.json'), JSON.stringify(config));
    expect(missingGlyphs(dir)).toEqual({ story: ['龘'], ui: ['鬱'] });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('collects glyphs from the paths the config names, and fails on a path that matches nothing', () => {
  const g = collectGlyphs(root);
  expect(g.story).toContain('百');
  expect(g.story).not.toMatch(/[\n ]/);
  const dir = mkdtempSync(join(tmpdir(), 'fonts-check-'));
  try {
    const config = { story: [{ file: join(root, 'script/script.json'), paths: ['lines[*].nope'] }] };
    writeFileSync(join(dir, 'fonts.config.json'), JSON.stringify(config));
    expect(() => collectGlyphs(dir)).toThrow(/matches no string/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
