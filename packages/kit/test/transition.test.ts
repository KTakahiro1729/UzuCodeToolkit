import { describe, expect, it } from 'vitest';
import { needed, stillNeeded } from '../src';

describe('needed', () => {
  it('turns a rule into a count of seats', () => {
    expect(needed('anyone', 3)).toBe(1);
    expect(needed('everyone', 3)).toBe(3);
    expect(needed('majority', 3)).toBe(2);
    expect(needed('majority', 4)).toBe(3);
    expect(needed({ only: 's1' }, 3)).toBe(1);
  });
  it('counts what is still missing, never below 0', () => {
    expect(stillNeeded('everyone', 3, 1)).toBe(2);
    expect(stillNeeded('majority', 3, 3)).toBe(0);
  });
});
