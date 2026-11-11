import { describe, expect, it } from 'vitest';
import { advanceDialogue, assignRoles, currentLine, startDialogue } from '../src';

const lines = [
  { speaker: 'a', text: '1' },
  { speaker: 'b', text: '2' },
];

describe('advanceDialogue', () => {
  it('話者だけが送れ、 最後の行で終わる', () => {
    const p = startDialogue();
    expect(() => advanceDialogue(lines, p, 'b', 0)).toThrow();
    advanceDialogue(lines, p, 'a', 0);
    expect(currentLine(lines, p)?.speaker).toBe('b');
    advanceDialogue(lines, p, 'b', 1);
    expect(p.finished).toBe(true);
    expect(currentLine(lines, p)).toBeNull();
    expect(() => advanceDialogue(lines, p, 'b', 1)).toThrow();
  });
  it('古い行を見て押した二重タップを弾く', () => {
    const p = startDialogue();
    advanceDialogue(lines, p, 'a', 0);
    expect(() => advanceDialogue(lines, p, 'a', 0)).toThrow();
    expect(p.index).toBe(1);
  });
});

describe('assignRoles', () => {
  it('選ばれたキャラを優先し、 残りを席順に割り当てる', () => {
    expect(
      assignRoles(
        [{ id: 's1' }, { id: 's2', characterId: 'b' }, { id: 's3', characterId: 'b' }],
        ['a', 'b', 'c'],
      ),
    ).toEqual({ s2: 'b', s1: 'a', s3: 'c' });
  });
});
