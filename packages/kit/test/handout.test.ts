import { describe, expect, it } from 'vitest';
import { GAME_START, type GameTime, plus } from '@uzuhq/code-sdk';
import { EXTENSION_MS, type Handout, type HandoutState, handoutLogic } from '../src';

const handout: Handout = {
  common: ['all'],
  parts: {
    a: { heading: 'A', body: ['a'], settings: [{ id: 'ship', label: 'Ship' }] },
    b: { heading: 'B', body: ['b'] },
  },
};
const parts = { s1: 'a', s2: 'b' };
const logic = handoutLogic(handout, { minutes: 5 });
const at = (ms: number): GameTime => plus(GAME_START, ms);
const act = (state: HandoutState, name: string, seat: string, payload: object = {}, time = at(0)) =>
  logic.actions![name]({
    state,
    playerId: seat,
    part: parts[seat as keyof typeof parts],
    parts,
    payload,
    time,
  });

describe('handoutLogic', () => {
  it('starts with empty fields and nobody done', () => {
    const s = logic.setup(parts, at(1000));
    expect(s).toEqual({
      endsAt: at(301_000),
      timeUp: false,
      ready: { s1: false, s2: false },
      values: { a: { ship: '' }, b: {} },
    });
    expect(logic.done(s)).toBe(false);
  });
  it('needs every field filled before a player is done', () => {
    const s = logic.setup(parts, at(1000));
    expect(() => act(s, 'ready', 's1')).toThrow();
    act(s, 'set', 's1', { id: 'ship', value: '  ' });
    expect(() => act(s, 'ready', 's1')).toThrow();
    act(s, 'set', 's1', { id: 'ship', value: 'Neo' });
    act(s, 'ready', 's1');
    expect(s.values.a.ship).toBe('Neo');
    expect(logic.done(s)).toBe(false);
    act(s, 'ready', 's2');
    expect(logic.done(s)).toBe(true);
  });
  it('rejects other parts’ settings, long values and edits after done', () => {
    const s = logic.setup(parts, at(1000));
    expect(() => act(s, 'set', 's2', { id: 'ship', value: 'x' })).toThrow();
    expect(() => act(s, 'set', 's1', { id: 'ship', value: 'x'.repeat(41) })).toThrow();
    act(s, 'set', 's1', { id: 'ship', value: 'x' });
    act(s, 'ready', 's1');
    expect(() => act(s, 'set', 's1', { id: 'ship', value: 'y' })).toThrow();
  });
  it('adds time for everyone while someone reads', () => {
    const s = logic.setup(parts, at(0));
    act(s, 'extend', 's1', {}, at(60_000));
    expect(s.endsAt).toBe(at(300_000 + EXTENSION_MS));
    act(s, 'set', 's1', { id: 'ship', value: 'x' });
    act(s, 'ready', 's1');
    expect(() => act(s, 'extend', 's1')).toThrow();
  });
  it('ends when the time is up, with settings left as they are', () => {
    const s = logic.setup(parts, at(0));
    expect(() => act(s, 'timeUp', 's2', {}, at(299_999))).toThrow();
    act(s, 'timeUp', 's2', {}, at(300_000));
    expect(logic.done(s)).toBe(true);
    expect(s.values.a.ship).toBe('');
  });
});
