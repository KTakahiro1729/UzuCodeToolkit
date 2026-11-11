import { readFileSync } from 'node:fs';
import { readerRoleOf } from '@uzu-toolkit/kit/dialogue';
import { describe, expect, it } from 'vitest';
import script from '../script/script.json';
import logic, { type State } from '../src/logic';
import { END_MARK, OPENING, ROLE_IDS, SPEAKER_NAMES, TITLE } from '../src/scenario';

const ctx = {} as never;
const players = [
  { id: 'seat-a', nickname: 'A', iconUrl: '' },
  { id: 'seat-b', nickname: 'B', iconUrl: '' },
];

describe('百本腕と勇者', () => {
  it('script.json は原文 (original.txt) と一字一句同じ', () => {
    const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8');
    const rebuilt = [
      TITLE,
      script.cast.map((c) => `${c.label}：${c.description}`).join('　　'),
      '',
      ...OPENING.lines.map((l) => `${SPEAKER_NAMES[l.speaker ?? '']}　${l.text}`),
      END_MARK,
      '',
    ].join('\n');
    expect(rebuilt).toBe(original);
  });

  it('勇と百が交互に送り、 最後まで読める', () => {
    const state: State = logic.setup({ players, ctx });
    expect(state.roles).toEqual({ 'seat-a': 'yu', 'seat-b': 'hyaku' });
    for (const [i, line] of OPENING.lines.entries()) {
      const role = readerRoleOf(OPENING, line, ROLE_IDS);
      const seat = Object.keys(state.roles).find((s) => state.roles[s] === role)!;
      logic.actions.advance({ state, playerId: seat, payload: { index: i }, ctx });
    }
    expect(state.phase).toBe('end');
  });
});
