import { describe, expect, it } from 'vitest';
import { GAME_START, type GameTime, plus } from '@uzuhq/code-sdk';
import { EXTENSION_MS, timedPhase, type TimedState, type TransitionRule } from '../src';

const parts = { s1: 'a', s2: 'b', s3: 'c' };
const at = (ms: number): GameTime => plus(GAME_START, ms);
const make = (rule?: TransitionRule | null) => {
  const logic = timedPhase({ minutes: 2, rule });
  const act = (state: TimedState, name: string, seat: string, time = at(0)) =>
    logic.actions![name]({ state, playerId: seat, part: parts[seat as keyof typeof parts], parts, payload: {}, time });
  return { logic, act, state: logic.setup(parts, at(1000)) };
};

describe('timedPhase', () => {
  it('runs for its minutes and ends by the time alone', () => {
    const { logic, act, state } = make();
    expect(state.endsAt).toEqual(at(121_000));
    expect(logic.done(state)).toBe(false);
    expect(() => act(state, 'done', 's1')).toThrow(/only the time/);
    expect(logic.deadline!.at(state)).toEqual(at(121_000));
    logic.deadline!.handler({ state, parts, time: at(121_000), random: {} as never });
    expect(logic.done(state)).toBe(true);
  });
  it('pauses and resumes, moving the end by the time it stood still', () => {
    const { logic, act, state } = make();
    act(state, 'pause', 's1', at(11_000));
    expect(logic.deadline!.at(state)).toBeNull();
    expect(() => act(state, 'pause', 's2', at(12_000))).toThrow();
    act(state, 'resume', 's2', at(31_000));
    expect(state.endsAt).toEqual(at(141_000));
    expect(() => act(state, 'resume', 's2', at(32_000))).toThrow();
  });
  it('gives more time to everyone, until the time is up', () => {
    const { logic, act, state } = make();
    act(state, 'extend', 's1');
    expect(state.endsAt).toEqual(at(121_000 + EXTENSION_MS));
    state.timeUp = true;
    expect(() => act(state, 'extend', 's1')).toThrow();
    expect(logic.done(state)).toBe(true);
  });
  it('ends early when everyone says they are done, and a player can take it back', () => {
    const { logic, act, state } = make('everyone');
    act(state, 'done', 's1');
    act(state, 'done', 's2');
    expect(() => act(state, 'done', 's2')).toThrow(/already/);
    act(state, 'undone', 's2');
    expect(() => act(state, 'undone', 's2')).toThrow();
    act(state, 'done', 's2');
    expect(logic.done(state)).toBe(false);
    act(state, 'done', 's3');
    expect(logic.done(state)).toBe(true);
  });
  it('ends on any one player', () => {
    const a = make('anyone');
    a.act(a.state, 'done', 's3');
    expect(a.logic.done(a.state)).toBe(true);
  });
  it('lets only the designated part end it', () => {
    const { logic, act, state } = make({ only: 'b' });
    expect(() => act(state, 'done', 's1')).toThrow(/not the one/);
    act(state, 'done', 's2');
    expect(logic.done(state)).toBe(true);
  });
});
