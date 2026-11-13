import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import script from '../script/script.json';

it('preserves the original title, lines and dialogue markers', () => {
  const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8')
    .replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  const markers: Record<string, string> = { yae: '女：', reiji: '男：', narration: '' };
  expect([script.title, ...script.lines.map(({ speaker, text }) => markers[speaker] + text)]).toEqual(original);
});
