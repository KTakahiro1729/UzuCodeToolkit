import { describe, expect, it } from 'vitest';
import { boxIn, layoutProblems, orientationsOf, rectOf, type ScreenLayout } from '../src/layout';
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
  it("draws the guide's nameplates at the width each scene gives them", () => {
    const L = READ_THROUGH_LAYOUT;
    const scene = (key: string) => L.scenes.find((s) => s.key === key)!;
    expect(boxIn(L, scene('self'), 'plate1', 'landscape')).toEqual([84, 217, 190, 32]);
    expect(boxIn(L, scene('other'), 'plate1', 'landscape')).toEqual([84, 217, 93, 32]);
    // The wide plate ② runs to the line's right edge, a nameplate gap after plate ①.
    for (const key of ['other', 'narr-other']) {
      for (const o of ['landscape', 'portrait'] as const) {
        const one = boxIn(L, scene(key), key === 'other' ? 'plate1' : 'plateNarration', o);
        const two = boxIn(L, scene(key), 'plate2', o);
        const text = rectOf(L, 'text', o);
        expect(two[0] - one[0] - one[2]).toBe(10);
        expect(two[0] + two[2]).toBe(text[0] + text[2]);
      }
    }
  });

  it("names a scene's box for a part it does not show, or for a screen the layout lacks", () => {
    const bad: ScreenLayout = {
      screen: 't',
      reference: { landscape: [100, 50] },
      parts: { a: { label: 'A', landscape: [0, 0, 10, 10] }, b: { label: 'B', landscape: [0, 0, 10, 10] } },
      scenes: [{ id: 1, key: 's', label: 'S', show: ['a'], mine: [], boxes: { b: { landscape: [1, 1, 5, 5] }, a: { portrait: [1, 1, 5, 5] } } }],
    };
    expect(layoutProblems(bad)).toEqual(['scene "s": box for part "b", which it does not show', 'scene "s": portrait box for part "a", but the layout has no portrait screen']);
  });
});
