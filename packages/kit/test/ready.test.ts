import { describe, expect, it } from 'vitest';
import { readyPhase } from '../src';

describe('readyPhase', () => {
  const phase = readyPhase();
  const args = (state: ReturnType<typeof phase.setup>, playerId: string) =>
    ({ state, playerId, part: '', parts: {}, payload: {}, time: 0 }) as never;
  it('ends once every seat is ready, a seat says so once, and can take it back', () => {
    const s = phase.setup({ a: 'x', b: 'y' }, 0 as never);
    phase.actions!.ready(args(s, 'a'));
    expect(phase.done(s)).toBe(false);
    expect(() => phase.actions!.ready(args(s, 'a'))).toThrow();
    phase.actions!.unready(args(s, 'a'));
    expect(() => phase.actions!.unready(args(s, 'a'))).toThrow();
    phase.actions!.ready(args(s, 'b'));
    expect(phase.done(s)).toBe(false);
    phase.actions!.ready(args(s, 'a'));
    expect(phase.done(s)).toBe(true);
  });
});
