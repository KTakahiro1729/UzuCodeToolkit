import { gameTime, plus } from '@uzuhq/code-sdk';
import { describe, expect, it } from 'vitest';
import { ballot, ballotClosed, castVote, formatClock, notVoted, secondsLeft, soleTop, tally } from '../src';

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

describe('ballot', () => {
  it('takes and changes votes until everyone has voted, then closes', () => {
    const b = ballot(['a', 'b', 'c']);
    castVote(b, 'a', 'b');
    castVote(b, 'a', 'c');
    expect(b.votes).toEqual({ a: 'c' });
    expect(notVoted(b)).toEqual(['b', 'c']);
    castVote(b, 'b', 'c');
    castVote(b, 'c', 'a');
    expect(ballotClosed(b)).toBe(true);
    expect(() => castVote(b, 'a', 'b')).toThrow('voting is over');
  });
  it('rejects a voter or candidate not on the ballot, and a vote for yourself', () => {
    const b = ballot(['a', 'b']);
    expect(() => castVote(b, 'x', 'a')).toThrow('not a voter');
    expect(() => castVote(b, 'a', 'x')).toThrow('unknown candidate');
    expect(() => castVote(b, 'a', 3)).toThrow('unknown candidate');
    expect(() => castVote(b, 'a', 'a')).toThrow('cannot vote for yourself');
  });
  it('can take other candidates, and a vote for yourself when allowed', () => {
    const b = ballot(['s1', 's2'], ['hero', 'thief', 's1']);
    castVote(b, 's1', 's1', { self: true });
    castVote(b, 's2', 'thief');
    expect(soleTop(b.votes, b.candidates)).toBeNull();
    expect(tally(b.votes, b.candidates)).toEqual({ hero: 0, thief: 1, s1: 1 });
  });
});
