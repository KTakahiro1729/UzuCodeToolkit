import { describe, expect, it } from 'vitest';
import { advanceDialogue, assignRoles, currentLine, startDialogue } from '../src';

const lines = [
  { speaker: 'a', text: '1' },
  { speaker: 'b', text: '2' },
];

describe('advanceDialogue', () => {
  it('only the speaker advances, and the last line finishes', () => {
    const p = startDialogue();
    expect(() => advanceDialogue(lines, p, 'b', 0)).toThrow();
    advanceDialogue(lines, p, 'a', 0);
    expect(currentLine(lines, p)?.speaker).toBe('b');
    advanceDialogue(lines, p, 'b', 1);
    expect(p.finished).toBe(true);
    expect(currentLine(lines, p)).toBeNull();
    expect(() => advanceDialogue(lines, p, 'b', 1)).toThrow();
  });
  it('rejects a duplicate tap made on an old line', () => {
    const p = startDialogue();
    advanceDialogue(lines, p, 'a', 0);
    expect(() => advanceDialogue(lines, p, 'a', 0)).toThrow();
    expect(p.index).toBe(1);
  });
});

describe('assignRoles', () => {
  it('prefers chosen characters and fills the rest in seat order', () => {
    expect(
      assignRoles(
        [{ id: 's1' }, { id: 's2', characterId: 'b' }, { id: 's3', characterId: 'b' }],
        ['a', 'b', 'c'],
      ),
    ).toEqual({ s2: 'b', s1: 'a', s3: 'c' });
  });
});
