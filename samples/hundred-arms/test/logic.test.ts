import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import script from '../script/script.json';
import logic from '../src/logic';

const ctx = {} as never;

describe('hundred-arms sample', () => {
  it('script.json matches original.txt character for character', () => {
    const original = readFileSync(new URL('../script/original.txt', import.meta.url), 'utf8');
    const label = Object.fromEntries(script.cast.map((c) => [c.id, c.label]));
    const rebuilt = [
      script.title,
      script.cast.map((c) => `${c.label}：${c.description}`).join('　　'),
      '',
      ...script.lines.map((l) => `${label[l.speaker]}　${l.text}`),
      script.end,
      '',
    ].join('\n');
    expect(rebuilt).toBe(original);
  });

  it('the two speakers alternate and reach the end', () => {
    const players = [
      { id: 'seat-a', nickname: 'A', iconUrl: '' },
      { id: 'seat-b', nickname: 'B', iconUrl: '' },
    ];
    const state = logic.setup({ players, ctx });
    const seatOf = (part: string) => Object.keys(state.parts).find((s) => state.parts[s] === part)!;
    script.lines.forEach((line, i) => {
      logic.actions['reading:advance']({ state, playerId: seatOf(line.speaker), payload: { index: i }, ctx });
    });
    expect(state.ended).toBe(true);
  });
});
