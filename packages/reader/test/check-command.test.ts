import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, describe, expect, it } from 'vitest';

const ENTRY = resolve(__dirname, '../../../tools/check/index.mjs');
const WORK = resolve(__dirname, '../../../samples/hundred-arms');
const out = mkdtempSync(join(tmpdir(), 'check-out-'));
afterAll(() => rmSync(out, { recursive: true, force: true }));

describe('the check command (docs/qa-contract.md)', () => {
  it('prints the four sections, writes report.json and exits 0 for a work with no error', () => {
    const r = spawnSync('node', [ENTRY, WORK, '--shots', 'none', '--out', out], { encoding: 'utf8' });
    expect(r.status).toBe(0);
    expect(r.stdout.match(/^(ERRORS|WARNINGS|NEXT|SHOTS)\b/gm)).toEqual(['ERRORS', 'WARNINGS', 'NEXT', 'SHOTS']);
    const report = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'));
    expect(report.ok).toBe(true);
    expect(report.shots.mode).toBe('none');
    expect(Array.isArray(report.next)).toBe(true);
  });
});
