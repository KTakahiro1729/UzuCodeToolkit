import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const text = readFileSync(fileURLToPath(new URL('../../../CHANGELOG.md', import.meta.url)), 'utf8');
const entries = text.split('\n').filter((l) => l.startsWith('- '));

describe('CHANGELOG.md', () => {
  it('has entries', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('tells a work what to do in every entry', () => {
    expect(entries.filter((l) => !/ Work action: \S/.test(l))).toEqual([]);
  });
});
