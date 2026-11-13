import { describe, expect, it } from 'vitest';
import { GAME_START } from '@uzuhq/code-sdk';
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

describe('reopen', () => {
  /** Over on `end`; reopen undoes it unless `lock` was sent. */
  const reopenable: PhaseLogic<{ over: boolean; lock: boolean }> = {
    setup: () => ({ over: false, lock: false }),
    actions: {
      end({ state }) {
        state.over = true;
      },
      lock({ state }) {
        state.lock = true;
        state.over = true;
      },
    },
    done: (state) => state.over,
    reopen({ state }) {
      if (state.lock) throw new Error('locked');
      state.over = false;
    },
  };
  const logic = flowLogic(
    [
      { id: 'read', logic: reopenable },
      { id: 'next', logic: emptyPhase() },
      { id: 'last', logic: emptyPhase() },
    ],
    ['x', 'y'],
  );
  const send = (state: FlowState, name: string) => logic.actions[name]({ state, playerId: 'seat-a', payload: {}, ctx });

  it('goes back from the next phase and sets it up again later', () => {
    const state = logic.setup({ players, ctx });
    send(state, 'read:end');
    expect(state.at).toBe(1);
    send(state, 'read:reopen');
    expect(state.at).toBe(0);
    expect(state.phases).toEqual({ read: { over: false, lock: false } });
    send(state, 'read:end');
    expect(state.phases.next).toEqual({ next: false });
  });
  it('refuses once anyone acts in the next phase, or when the phase says no', () => {
    const state = logic.setup({ players, ctx });
    expect(() => send(state, 'read:reopen')).toThrow();
    send(state, 'read:end');
    send(state, 'next:next');
    expect(() => send(state, 'read:reopen')).toThrow();
    const locked = logic.setup({ players, ctx });
    send(locked, 'read:lock');
    expect(() => send(locked, 'read:reopen')).toThrow();
  });
});

describe('emptyPhase with a facilitator', () => {
  it('lets only the facilitator’s part move the phase on', () => {
    const logic = emptyPhase({ facilitator: 'a' });
    const s = logic.setup({}, GAME_START);
    const args = (part: string) => ({ state: s, playerId: 'x', part, parts: {}, payload: {}, time: GAME_START });
    expect(() => logic.actions!.next(args('b'))).toThrow();
    logic.actions!.next(args('a'));
    expect(logic.done(s)).toBe(true);
  });
});

describe('flowLogic voice rooms', () => {
  const rooms: PhaseLogic<{ room: Record<string, string> }> = {
    setup: (parts) => ({ room: Object.fromEntries(Object.keys(parts).map((s) => [s, 'hall'])) }),
    voicePlan: ({ state, seat }) => ({ room: state.room[seat], mic: 'free' }),
    done: () => false,
  };
  const logic = flowLogic([{ id: 'talk', logic: rooms }, { id: 'end', logic: emptyPhase() }], ['x', 'y']);

  it('asks the current phase for each player’s room', () => {
    const state = logic.setup({ players, ctx });
    expect(logic.voicePlan!({ state, playerId: 'seat-a' })).toEqual({ room: 'hall', mic: 'free' });
    (state.phases.talk as { room: Record<string, string> }).room['seat-b'] = 'attic';
    expect(logic.voicePlan!({ state, playerId: 'seat-b' })).toEqual({ room: 'attic', mic: 'free' });
  });

  it('is the whole-game room when the phase names none', () => {
    const plain = flowLogic([{ id: 'a', logic: emptyPhase() }], ['x', 'y']);
    const state = plain.setup({ players, ctx });
    expect(plain.voicePlan!({ state, playerId: 'seat-a' })).toEqual({ room: null, mic: 'free' });
  });
});

