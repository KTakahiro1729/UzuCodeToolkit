import { mkdtempSync, rmSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs tool
import { buildSkill, NAME } from '../../../tools/skill/build.mjs';

describe('the ChatGPT skill zip', () => {
  it('has one top-level folder with a SKILL.md whose name is the folder and whose description is short', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'skill-test-'));
    const file = await buildSkill(join(dir, 'out.zip'));
    const zip = await JSZip.loadAsync(readFileSync(file));
    const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir);
    expect(new Set(names.map((n) => n.split('/')[0]))).toEqual(new Set([NAME]));
    expect(names.filter((n) => /skill\.md$/i.test(n))).toEqual([`${NAME}/SKILL.md`]);
    expect(names).toContain(`${NAME}/references/new-work.md`);
    const md = await zip.file(`${NAME}/SKILL.md`)!.async('string');
    const front = /^---\nname: (.+)\ndescription: (.+)\n---\n/.exec(md);
    expect(front?.[1]).toBe(NAME);
    expect(front![2].length).toBeLessThanOrEqual(1024);
    expect(names.length).toBeLessThan(500);
    rmSync(dir, { recursive: true, force: true });
  });
});
