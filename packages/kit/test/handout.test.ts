import { describe, expect, it } from 'vitest';
import { type Handout, type HandoutState, handoutLogic } from '../src';

const handout: Handout = {
  common: ['all'],
  parts: {
    a: { heading: 'A', body: ['a'], settings: [{ id: 'ship', label: 'Ship' }] },
    b: { heading: 'B', body: ['b'] },
  },
};
const parts = { s1: 'a', s2: 'b' };
const logic = handoutLogic(handout);
const act = (state: HandoutState, name: string, seat: string, payload: object = {}) =>
  logic.actions![name]({ state, playerId: seat, part: parts[seat as keyof typeof parts], parts, payload });

describe('handoutLogic', () => {
  it('starts with empty fields and nobody done', () => {
    const s = logic.setup(parts);
    expect(s).toEqual({ ready: { s1: false, s2: false }, values: { a: { ship: '' }, b: {} } });
    expect(logic.done(s)).toBe(false);
  });
  it('needs every field filled before a player is done', () => {
    const s = logic.setup(parts);
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
    const s = logic.setup(parts);
    expect(() => act(s, 'set', 's2', { id: 'ship', value: 'x' })).toThrow();
    expect(() => act(s, 'set', 's1', { id: 'ship', value: 'x'.repeat(41) })).toThrow();
    act(s, 'set', 's1', { id: 'ship', value: 'x' });
    act(s, 'ready', 's1');
    expect(() => act(s, 'set', 's1', { id: 'ship', value: 'y' })).toThrow();
  });
});
