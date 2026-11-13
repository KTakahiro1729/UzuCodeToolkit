import { describe, expect, it } from 'vitest';
import { LAYOUT, NAME_GAP, NAME_WIDTH, REFERENCE, type Rect, stageScene } from '../src/stage-layout';

const right = ([x, , w]: Rect): number => x + w;
const bottom = ([, y, , h]: Rect): number => y + h;
const overlap = (a: Rect, b: Rect): boolean => a[0] < right(b) && b[0] < right(a) && a[1] < bottom(b) && b[1] < bottom(a);

describe('the guide layout', () => {
  for (const o of ['landscape', 'portrait'] as const) {
    const L = LAYOUT[o];
    const { width, height } = REFERENCE[o];

    it(`${o}: every part is on the reference screen`, () => {
      for (const r of [L.tag, L.c1, L.c2, L.solo, L.frame, L.text, L.names, L.log, L.next, L.panel]) {
        expect(r[0]).toBeGreaterThanOrEqual(0);
        expect(r[1]).toBeGreaterThanOrEqual(0);
        expect(right(r)).toBeLessThanOrEqual(width);
        expect(bottom(r)).toBeLessThanOrEqual(height);
      }
    });

    it(`${o}: text and buttons stay out of the empty edges and of what UZU draws`, () => {
      const { margin, reserved } = L;
      for (const r of [L.tag, L.text, L.names, L.log, L.next, L.panel]) {
        expect(r[0]).toBeGreaterThanOrEqual(margin.left);
        expect(right(r)).toBeLessThanOrEqual(width - margin.right);
        expect(r[1]).toBeGreaterThanOrEqual(margin.top);
        expect(bottom(r)).toBeLessThanOrEqual(height - margin.bottom);
        expect(overlap(r, reserved.hud)).toBe(false);
      }
    });

    it(`${o}: the line fits inside the frame, the log link and next button too`, () => {
      for (const r of [L.text, L.log, L.next]) {
        expect(r[0]).toBeGreaterThanOrEqual(L.frame[0]);
        expect(right(r)).toBeLessThanOrEqual(right(L.frame));
        expect(r[1]).toBeGreaterThanOrEqual(L.frame[1]);
        expect(bottom(r)).toBeLessThanOrEqual(bottom(L.frame));
      }
    });

    it(`${o}: the nameplate widths give the guide's positions for nameplate ②`, () => {
      const [x, , w] = L.names;
      const second = (first: number): [number, number] => [x + first + NAME_GAP, w - first - NAME_GAP];
      // ② with the next mark and name alone: x284 and 190 wide landscape, x232 and 138 portrait.
      expect([second(NAME_WIDTH.full)[0], L.nextTagWidth]).toEqual(o === 'landscape' ? [284, 190] : [232, 138]);
      // ② with the next line (another speaks, you are next) follows ①'s own width, 10px after it, and takes the rest of the row
      // (the guide: x187 and 603 wide landscape, x135 and 235 portrait, with its template's 78-wide ①).
      expect(right(L.names) - second(78)[0]).toBe(second(78)[1]);
      // ② in the narration another reads: x210 and 580 wide, x158 and 212.
      expect(second(NAME_WIDTH.narration)).toEqual(o === 'landscape' ? [210, 580] : [158, 212]);
    });
  }
});

describe('stageScene', () => {
  // Lines: a speaks, b speaks, a speaks, narration, b speaks, a speaks.
  const lines = [
    { speaker: 'a', text: '1' },
    { speaker: 'b', text: '2' },
    { speaker: 'a', text: '3' },
    { speaker: 'n', text: '4' },
    { speaker: 'b', text: '5' },
    { speaker: 'a', text: '6' },
  ];
  const isDirection = (l: { speaker: string | readonly string[] }) => l.speaker === 'n';
  const at = (i: number, roles: string[]) => stageScene(lines, i, roles, isDirection);

  it('a role first appears on its first line: screen 3', () => {
    expect(at(0, ['a']).id).toBe(3);
    expect(at(0, ['a']).chars).toBe('solo');
    expect(at(1, ['a']).id).toBe(3);
    expect(at(1, ['a']).mine).toBe(false);
  });

  it('you speak: screen 1, your colour, both characters, the next reader on nameplate ②', () => {
    const s = at(2, ['a']);
    expect(s.id).toBe(1);
    expect(s.mine).toBe(true);
    expect(s.chars).toBe('one'); // the next line is the narration: no second character
    expect(s.plate2).toBe('tag');
    const t = stageScene(lines, 4, ['b'], isDirection);
    expect(t.id).toBe(1);
    expect(t.chars).toBe('pair');
    expect(t.second).toBe('a');
  });

  it('another speaks and you are next: screen 2, nameplate ② shows your next line', () => {
    const s = at(4, ['a']);
    expect(s.id).toBe(2);
    expect(s.mine).toBe(false);
    expect(s.chars).toBe('pair');
    expect(s.next).toMatchObject({ role: 'a', mine: true });
    expect(s.plate2).toBe('preview');
  });

  it('narration: screens 4 (you read) and 5, no characters', () => {
    expect(at(3, ['n']).id).toBe(4);
    expect(at(3, ['a']).id).toBe(5);
    expect(at(3, ['a']).chars).toBe('none');
    expect(at(3, ['a']).speaker).toBeNull();
  });

  it('the last line has no nameplate ②; one speaker continuing has none either', () => {
    expect(at(5, ['a']).plate2).toBeNull();
    const cont = stageScene(
      [{ speaker: 'a', text: '1' }, { speaker: 'a', text: '2' }, { speaker: 'a', text: '3' }],
      1,
      ['a'],
      () => false,
    );
    expect(cont.plate2).toBeNull();
    expect(cont.next).toBeNull();
  });

  it('a role that doubles counts as one reader: your other role is not a continuation', () => {
    const s = stageScene([{ speaker: 'a', text: '1' }, { speaker: 'b', text: '2' }, { speaker: 'a', text: '3' }], 1, ['a', 'b'], () => false);
    expect(s.mine).toBe(true);
    expect(s.next).toMatchObject({ role: 'a', mine: true });
    expect(s.plate2).toBe('tag');
  });

  it('a first appearance counts a line spoken together', () => {
    const together = [{ speaker: ['a', 'b'], text: '1' }, { speaker: 'b', text: '2' }];
    expect(stageScene(together, 1, ['b'], () => false).id).toBe(1);
  });
});
