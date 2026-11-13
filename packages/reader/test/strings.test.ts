import { describe, expect, it } from 'vitest';
import STRINGS, { overrideStrings } from '../src/strings';

describe('overrideStrings', () => {
  it('replaces the given keys and keeps the others', () => {
    const before = { ...STRINGS };
    overrideStrings({ 'button.back': 'Return' });
    expect(STRINGS['button.back']).toBe('Return');
    expect(STRINGS['button.end']).toBe(before['button.end']);
    overrideStrings({ 'button.back': before['button.back'] });
  });

  it('refuses a key the toolkit does not have, so a typo is not silently ignored', () => {
    expect(() => overrideStrings({ 'button.nope': 'x' } as never)).toThrow('unknown UI string');
  });
});
