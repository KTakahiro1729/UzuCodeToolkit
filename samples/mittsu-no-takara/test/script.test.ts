import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkAgainstAozora } from '../../aozora-check';
import script from '../script/script.json';

describe('三つの宝 script', () => {
  it('script.json matches the Aozora Bunko text line for line', () => {
    const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8');
    const { expected, rebuilt } = checkAgainstAozora(script, original);
    expect(rebuilt).toEqual(expected);
  });
});
