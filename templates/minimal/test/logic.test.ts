/**
 * ロジックを SDK のサーバー無しで通しで動かす。 手元で全行を読み切れることを確かめる。
 */
import { describe, expect, it } from 'vitest';
import logic, { type State } from '../src/logic';
import { OPENING, ROLE_IDS } from '../src/scenario';
import { readerRoleOf } from '@uzu-toolkit/kit/dialogue';

const ctx = {} as never;
const players = [
  { id: 'seat-a', nickname: 'A', iconUrl: '' },
  { id: 'seat-b', nickname: 'B', iconUrl: '', characterId: 'hina' },
];

function newState(): State {
  return logic.setup({ players, ctx });
}

describe('minimal logic', () => {
  it('担当が順に送ると最後まで読めて end になる', () => {
    const state = newState();
    expect(state.roles).toEqual({ 'seat-b': 'hina', 'seat-a': 'ren' });
    for (const [i, line] of OPENING.lines.entries()) {
      const role = readerRoleOf(OPENING, line, ROLE_IDS);
      const seat = Object.keys(state.roles).find((s) => state.roles[s] === role)!;
      logic.actions.advance({ state, playerId: seat, payload: { index: i }, ctx });
    }
    expect(state.phase).toBe('end');
  });
  it('全員が同意すると読み飛ばせる', () => {
    const state = newState();
    logic.actions.skip({ state, playerId: 'seat-a', payload: {}, ctx });
    expect(state.phase).toBe('dialogue');
    logic.actions.skip({ state, playerId: 'seat-b', payload: {}, ctx });
    expect(state.phase).toBe('end');
  });
});
