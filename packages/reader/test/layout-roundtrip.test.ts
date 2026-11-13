import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { deckBytes } from '../../../tools/layout/slides/export.mjs';
import { importSlides } from '../../../tools/layout/slides/import.mjs';
import type { ScreenLayout } from '../src/layout';
import { READ_THROUGH_LAYOUT } from '../src/stage-layout';

const copy = (): ScreenLayout => JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT)) as ScreenLayout;
const deckOf = async (layout: ScreenLayout, o: 'landscape' | 'portrait'): Promise<Uint8Array> => new Uint8Array(await deckBytes(layout, o));
/** What Google Slides does to a deck on the way back: every shape gets a name of its own, alt text stays. */
async function renamed(bytes: Uint8Array): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(bytes);
  for (const name of Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))) {
    const xml = await zip.file(name)!.async('string');
    zip.file(name, xml.replace(/(<p:cNvPr id="(\d+)") name="[^"]*"/g, '$1 name="Google Shape;$2;p3"'));
  }
  return zip.generateAsync({ type: 'uint8array' });
}

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

  it('boxes renamed by a slide tool are still read by their alt text', async () => {
    const moved = copy();
    moved.parts.plate2!.landscape = [300, 217, 190, 32];
    const result = await importSlides(copy() as never, await renamed(await deckOf(moved, 'landscape')));
    expect(result.moved).toEqual([{ id: 'plate2', orientation: 'landscape', from: [284, 217, 190, 32], to: [300, 217, 190, 32] }]);
    expect(result.added).toEqual([]);
  });

  it('an alignment changed on the slides changes the part in the layout', async () => {
    const aligned = copy();
    aligned.parts.log!.align = 'right';
    const result = await importSlides(copy() as never, await deckOf(aligned, 'landscape'));
    expect(result.aligned).toEqual([{ id: 'log', from: 'left', to: 'right' }]);
    expect(result.layout.parts.log!.align).toBe('right');
  });

  it('the deck is a zip of slides, one per scene', async () => {
    const zip = await JSZip.loadAsync(await deckOf(copy(), 'landscape'));
    expect(Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))).toHaveLength(6);
  });
});
