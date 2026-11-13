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

describe('reading strings', () => {
  it('no screen reads strings.json directly, so startFlow({ strings }) reaches every label', async () => {
    const { readdirSync, readFileSync, statSync } = await import('node:fs');
    const { join } = await import('node:path');
    const root = join(__dirname, '../src');
    const bad: string[] = [];
    const walk = (dir: string): void => {
      for (const name of readdirSync(dir)) {
        const path = join(dir, name);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(svelte|ts)$/.test(name) && name !== 'strings.ts' && /strings\.json/.test(readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))) bad.push(path);
      }
    };
    walk(root);
    expect(bad).toEqual([]);
  });
});
