import { describe, expect, it } from 'vitest';
import { emptyPhase, type FlowState, flowLogic, type PhaseLogic } from '../src';

const ctx = { time: 0 } as never;
const players = [
  { id: 'seat-a', nickname: 'A', iconUrl: '' },
  { id: 'seat-b', nickname: 'B', iconUrl: '' },
] as never;

/** A phase over once every part has said `ok`. */
const everyone: PhaseLogic<string[]> = {
  setup: () => [],
  actions: {
    ok({ state, part }) {
      if (!state.includes(part)) state.push(part);
    },
  },
  done: (state) => state.length === 2,
};

describe('flowLogic', () => {
  const logic = flowLogic(
    [
      { id: 'intro', logic: emptyPhase() },
      { id: 'talk', logic: everyone },
      { id: 'end', logic: emptyPhase() },
    ],
    ['x', 'y'],
  );
  const send = (state: FlowState, name: string, playerId = 'seat-a') =>
    logic.actions[name]({ state, playerId, payload: {}, ctx });

  it('enters each phase in order and ends after the last', () => {
    const state = logic.setup({ players, ctx });
    expect(state.parts).toEqual({ 'seat-a': 'x', 'seat-b': 'y' });
    expect(state.phases).toEqual({ intro: { next: false } });
    send(state, 'intro:next');
    expect(state.at).toBe(1);
    expect(state.phases.talk).toEqual([]);
    send(state, 'talk:ok', 'seat-a');
    expect(state.at).toBe(1);
    send(state, 'talk:ok', 'seat-b');
    expect(state.at).toBe(2);
    expect(state.ended).toBe(false);
    send(state, 'end:next');
    expect(state.at).toBe(2);
    expect(state.ended).toBe(true);
  });

  it("rejects another phase's action, such as a late second tap on next", () => {
    const state = logic.setup({ players, ctx });
    expect(() => send(state, 'talk:ok')).toThrow();
    send(state, 'intro:next');
    expect(() => send(state, 'intro:next')).toThrow();
    expect(state.at).toBe(1);
  });

  it('rejects duplicate phase IDs', () => {
    expect(() => flowLogic([{ id: 'a', logic: emptyPhase() }, { id: 'a', logic: emptyPhase() }], ['x'])).toThrow();
  });
});

describe('phase deadline', () => {
  /** Over when its timer runs out. */
  const timed: PhaseLogic<{ endsAt: number; over: boolean }> = {
    setup: (_parts, time) => ({ endsAt: (time as unknown as number) + 300, over: false }),
    done: (state) => state.over,
    deadline: {
      at: (state) => state.endsAt as never,
      handler({ state }) {
        state.over = true;
      },
    },
  };
  const logic = flowLogic([{ id: 'intro', logic: emptyPhase() }, { id: 'read', logic: timed }, { id: 'end', logic: emptyPhase() }], ['x', 'y']);

  it("reads the current phase's deadline and moves on when it comes", () => {
    const state = logic.setup({ players, ctx });
    const deadline = logic.deadlines!.phase;
    expect(deadline.at({ state } as never)).toBeUndefined();
    logic.actions['intro:next']({ state, playerId: 'seat-a', payload: {}, ctx: { time: 1000 } as never });
    expect(deadline.at({ state } as never)).toBe(1300);
    deadline.handler({ state, ctx: { time: 1300 } } as never);
    expect(state.at).toBe(2);
  });
});
