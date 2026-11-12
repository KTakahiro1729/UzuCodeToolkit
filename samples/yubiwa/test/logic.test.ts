import { partsOf, readerOf } from '@uzu-toolkit/kit';
import { describe, expect, it } from 'vitest';
import manifest from '../manifest.json';
import script from '../script/script.json';
import logic from '../src/logic';

const ctx = {} as never;

describe('read-through', () => {
  it('each seat reads the lines of its part and the script reaches the end', () => {
    const players = manifest.characters.map((c, i) => ({ id: `seat-${i}`, nickname: c.name, iconUrl: '' }));
    const state = logic.setup({ players, ctx });
    const parts = partsOf(script);
    const seatOf = (role: string) => {
      const part = parts.find((p) => p.roles.includes(role))!.id;
      return Object.keys(state.parts).find((s) => state.parts[s] === part)!;
    };
    script.lines.forEach((line, i) => {
      const other = players.find((p) => p.id !== seatOf(readerOf(line)))!.id;
      expect(() => logic.actions.advance({ state, playerId: other, payload: { index: i }, ctx })).toThrow();
      logic.actions.advance({ state, playerId: seatOf(readerOf(line)), payload: { index: i }, ctx });
    });
    expect(state.dialogue.finished).toBe(true);
  });
});
