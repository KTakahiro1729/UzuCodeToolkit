import { describe, expect, it } from 'vitest';
import { advanceDialogue, assignParts, currentLine, parseRuby, partsOf, startDialogue } from '../src';

const lines = [
  { speaker: 'a', text: '1' },
  { speaker: 'b', text: '2' },
];

describe('advanceDialogue', () => {
  it('only the reader advances, and the last line finishes', () => {
    const p = startDialogue();
    expect(() => advanceDialogue(lines, p, ['b'], 0)).toThrow();
    advanceDialogue(lines, p, ['a'], 0);
    expect(currentLine(lines, p)?.speaker).toBe('b');
    advanceDialogue(lines, p, ['b'], 1);
    expect(p.finished).toBe(true);
    expect(currentLine(lines, p)).toBeNull();
    expect(() => advanceDialogue(lines, p, ['b'], 1)).toThrow();
  });
  it('rejects a duplicate tap made on an old line', () => {
    const p = startDialogue();
    advanceDialogue(lines, p, ['a'], 0);
    expect(() => advanceDialogue(lines, p, ['a'], 0)).toThrow();
    expect(p.index).toBe(1);
  });
  it('lets a player with several roles read each of them', () => {
    const three = [...lines, { speaker: 'c', text: '3' }];
    const p = startDialogue();
    advanceDialogue(three, p, ['a', 'c'], 0);
    expect(() => advanceDialogue(three, p, ['a', 'c'], 1)).toThrow();
    advanceDialogue(three, p, ['b'], 1);
    advanceDialogue(three, p, ['a', 'c'], 2);
    expect(p.finished).toBe(true);
  });
  it('gives a line spoken together to its first speaker', () => {
    const joint = [{ speaker: ['b', 'a'], text: '1' }];
    const p = startDialogue();
    expect(() => advanceDialogue(joint, p, ['a'], 0)).toThrow();
    advanceDialogue(joint, p, ['b'], 0);
    expect(p.finished).toBe(true);
  });
});

describe('parts', () => {
  it('default to one part per cast entry', () => {
    expect(partsOf({ cast: [{ id: 'a', label: 'A' }] })).toEqual([{ id: 'a', name: 'A', roles: ['a'] }]);
  });
  it('seats prefer chosen parts and fill the rest in seat order', () => {
    expect(
      assignParts(
        [{ id: 's1' }, { id: 's2', characterId: 'b' }, { id: 's3', characterId: 'b' }],
        ['a', 'b', 'c'],
      ),
    ).toEqual({ s2: 'b', s1: 'a', s3: 'c' });
  });
});

describe('parseRuby', () => {
  it('reads both Aozora forms and keeps the rest as text', () => {
    expect(parseRuby('三人の盗人《ぬすびと》が｜一飛び《ひととび》だ')).toEqual([
      { text: '三人の' },
      { text: '盗人', ruby: 'ぬすびと' },
      { text: 'が' },
      { text: '一飛び', ruby: 'ひととび' },
      { text: 'だ' },
    ]);
  });
});

