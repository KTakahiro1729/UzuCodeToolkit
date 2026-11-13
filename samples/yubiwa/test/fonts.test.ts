// The bundled font subsets must hold every glyph the work shows (rebuild with `npm run fonts`).
import { expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { missingGlyphs } from '../../../tools/fonts/fonts.mjs';

it('font subsets hold every glyph the work shows', () => {
  expect(missingGlyphs(fileURLToPath(new URL('..', import.meta.url)))).toEqual({ story: [], ui: [] });
});
