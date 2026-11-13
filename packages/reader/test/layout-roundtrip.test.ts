import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { buildDeck } from '../../../tools/layout/slides/export.mjs';
import { importSlides } from '../../../tools/layout/slides/import.mjs';
import type { ScreenLayout } from '../src/layout';
import { READ_THROUGH_LAYOUT } from '../src/stage-layout';

const copy = (): ScreenLayout => JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT)) as ScreenLayout;
const deckOf = async (layout: ScreenLayout, o: 'landscape' | 'portrait'): Promise<Uint8Array> =>
  (await buildDeck(layout, o).write({ outputType: 'uint8array' })) as Uint8Array;

describe('slides written out and read back', () => {
  for (const o of ['landscape', 'portrait'] as const) {
    it(`${o}: reading back untouched slides changes nothing`, async () => {
      const result = await importSlides(copy() as never, await deckOf(copy(), o));
      expect({ moved: result.moved, added: result.added, removed: result.removed, conflicts: result.conflicts, problems: result.problems }).toEqual({
        moved: [],
        added: [],
        removed: [],
        conflicts: [],
        problems: [],
      });
    });
  }

  it('a box moved on the slides moves the part in the layout', async () => {
    const moved = copy();
    moved.parts.next!.landscape = [600, 321, 160, 44];
    const result = await importSlides(copy() as never, await deckOf(moved, 'landscape'));
    expect(result.moved).toEqual([{ id: 'next', orientation: 'landscape', from: [670, 321, 120, 44], to: [600, 321, 160, 44] }]);
    expect(result.layout.parts.next!.landscape).toEqual([600, 321, 160, 44]);
    expect(result.conflicts).toEqual([]);
  });

  it('the deck is a zip of slides, one per scene', async () => {
    const zip = await JSZip.loadAsync(await deckOf(copy(), 'landscape'));
    expect(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))).toHaveLength(6);
  });
});
