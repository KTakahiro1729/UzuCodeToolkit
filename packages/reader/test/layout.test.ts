import { describe, expect, it } from 'vitest';
import { layoutProblems, orientationsOf, rectOf, type ScreenLayout } from '../src/layout';
import { READ_THROUGH_LAYOUT } from '../src/stage-layout';

describe('layout definitions', () => {
  it("the read-through's layout is sound", () => {
    expect(layoutProblems(READ_THROUGH_LAYOUT)).toEqual([]);
  });

  it("the read-through has the guide's six scenes, numbered as the guide does", () => {
    expect(READ_THROUGH_LAYOUT.scenes.map((s) => s.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('every part sits on its reference screen', () => {
    for (const o of orientationsOf(READ_THROUGH_LAYOUT)) {
      const [width, height] = READ_THROUGH_LAYOUT.reference[o]!;
      for (const id of Object.keys(READ_THROUGH_LAYOUT.parts)) {
        const [x, y, w, h] = rectOf(READ_THROUGH_LAYOUT, id, o);
        expect([x >= 0, y >= 0, x + w <= width, y + h <= height]).toEqual([true, true, true, true]);
      }
    }
  });

  it('names what is wrong', () => {
    const broken: ScreenLayout = {
      screen: 'x',
      reference: { landscape: [100, 50] },
      parts: { a: { label: 'a', landscape: [0, 0, 10, 10] }, 'b-1': { label: 'b', image: 'a/b', landscape: [0, 0, 0, 10] } },
      scenes: [
        { id: 1, key: 's', label: 's', show: ['a', 'c'], mine: ['b-1'] },
        { id: 2, key: 's', label: 's', show: [], mine: [] },
      ],
    };
    expect(layoutProblems(broken)).toEqual([
      'part id "b-1" is not letters and digits',
      'part "b-1": image "a/b" is not a plain file name',
      'part "b-1": empty landscape box',
      'scene "s": unknown part "c"',
      'scene "s": part "b-1" takes your colour but is not shown',
      'scene key "s" twice',
    ]);
  });

  it('a layout may leave portrait out', () => {
    const wide: ScreenLayout = { screen: 'x', reference: { landscape: [100, 50] }, parts: { a: { label: 'a', landscape: [0, 0, 10, 10] } }, scenes: [] };
    expect(orientationsOf(wide)).toEqual(['landscape']);
    expect(layoutProblems(wide)).toEqual([]);
    expect(() => rectOf(wide, 'a', 'portrait')).toThrow(/no portrait box/);
  });
});
