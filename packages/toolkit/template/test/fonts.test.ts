// The bundled font subsets must hold every glyph the work shows (rebuild with `npm run fonts`).
// Red until `npm run fonts` has made src/fonts/ (it needs fonttools and the network); keep it, and say so in the report.
import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { missingGlyphs } from '@uzu-toolkit/toolkit/tools/fonts/fonts.mjs';

it('font subsets hold every glyph the work shows', () => {
  expect(missingGlyphs(fileURLToPath(new URL('..', import.meta.url)))).toEqual({ story: [], ui: [] });
});
