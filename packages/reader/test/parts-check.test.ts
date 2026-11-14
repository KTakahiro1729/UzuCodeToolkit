import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error the check is plain .mjs
import { check } from '../../../tools/check/parts.mjs';

const FIXTURES = join(__dirname, '../../../tools/check/fixtures');
const run = (rule: string, kind: 'ok' | 'bad') =>
  (check(join(FIXTURES, rule, kind)) as [string, string][]).filter(([, r]) => r === rule);

describe('parts check', () => {
  it.each([
    ['bare-button', 'warnings'],
    ['raw-colour', 'errors'],
    ['raw-font', 'errors'],
  ])('%s: the bad folder is reported as %s, the ok folder is silent', (rule, list) => {
    expect(run(rule, 'ok')).toEqual([]);
    const found = run(rule, 'bad');
    expect(found.length).toBeGreaterThan(0);
    expect(found.every(([l]) => l === list)).toBe(true);
  });

  it('finds each raw colour of the bad screen', () => {
    expect(run('raw-colour', 'bad')).toHaveLength(4);
  });
});
