import { gameTime, plus } from '@uzuhq/code-sdk';
import { describe, expect, it } from 'vitest';
import { formatClock, secondsLeft, soleTop, tally } from '../src';

describe('tally and soleTop', () => {
  const seats = ['a', 'b', 'c'];
  it('counts every candidate, 0 for none', () => {
    expect(tally({ a: 'b', c: 'b' }, seats)).toEqual({ a: 0, b: 2, c: 0 });
  });
  it('the sole leader, or null on a tie or no votes', () => {
    expect(soleTop({ a: 'b', b: 'c', c: 'b' }, seats)).toBe('b');
    expect(soleTop({ a: 'b', b: 'c', c: 'a' }, seats)).toBeNull();
    expect(soleTop({}, seats)).toBeNull();
  });
  it('ignores a vote for someone who is not a candidate', () => {
    expect(soleTop({ a: 'x', b: 'c' }, seats)).toBe('c');
  });
});

describe('clock', () => {
  it('rounds up to whole seconds and stops at 0', () => {
    const now = gameTime();
    expect(secondsLeft(plus(now, 61_200), now)).toBe(62);
    expect(secondsLeft(now, plus(now, 5000))).toBe(0);
  });
  it('formats as m:ss', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(305)).toBe('5:05');
  });
});
