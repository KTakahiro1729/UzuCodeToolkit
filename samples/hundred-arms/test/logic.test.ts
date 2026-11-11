import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import script from '../script/script.json';
import logic from '../src/logic';
import { END_MARK, LINES, SPEAKER_NAMES, TITLE } from '../src/scenario';

const ctx = {} as never;

describe('hundred-arms sample', () => {
  it('script.json matches original.txt character for character', () => {
    const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8');
    const rebuilt = [
      TITLE,
      script.cast.map((c) => `${c.label}：${c.description}`).join('　　'),
      '',
      ...LINES.map((l) => `${SPEAKER_NAMES[l.speaker]}　${l.text}`),
      END_MARK,
      '',
    ].join('\n');
    expect(rebuilt).toBe(original);
  });

  it('the two speakers alternate and reach the end', () => {
    const players = [
      { id: 'seat-a', nickname: 'A', iconUrl: '' },
      { id: 'seat-b', nickname: 'B', iconUrl: '' },
    ];
    const state = logic.setup({ players, ctx });
    const seatOf = (role: string) => Object.keys(state.roles).find((s) => state.roles[s] === role)!;
    LINES.forEach((line, i) => {
      logic.actions.advance({ state, playerId: seatOf(line.speaker), payload: { index: i }, ctx });
    });
    expect(state.dialogue.finished).toBe(true);
  });
});
