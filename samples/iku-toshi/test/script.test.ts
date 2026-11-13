import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import script from '../script/script.json';

it('preserves every nonblank line of the supplied text', () => {
  const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8')
    .split(/\r?\n/u)
    .filter((line) => line.trim());
  const rebuilt = script.lines.map((line) => 'label' in line ? `${line.label}：${line.text}` : line.text);
  expect([script.title, ...rebuilt]).toEqual(original);
});
