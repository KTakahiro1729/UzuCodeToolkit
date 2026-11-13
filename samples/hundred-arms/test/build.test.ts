// A read-through-only work must not ship what it does not use: build it and look at the output.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/** The whole output, measured on 2026-11-13 at about 145 KB, with a little room. */
const MAX_BYTES = 160 * 1024;

const root = fileURLToPath(new URL('..', import.meta.url));
const cardNames = readdirSync(fileURLToPath(new URL('../../../packages/reader/src/cards', import.meta.url)))
  .filter((f) => f.endsWith('.svg'))
  .map((f) => f.slice(0, -4));
const vite = join(dirname(createRequire(import.meta.url).resolve('vite/package.json')), 'bin/vite.js');
const outDir = mkdtempSync(join(tmpdir(), 'hundred-arms-build-'));
const files: { name: string; bytes: number }[] = [];

beforeAll(() => {
  // As `npm run build` does it: under Vitest (NODE_ENV=test) Svelte would compile its larger dev build.
  execFileSync(process.execPath, [vite, 'build', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'silent'], {
    cwd: root,
    env: { ...process.env, NODE_ENV: 'production' },
  });
  const walk = (dir: string): void => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else files.push({ name: e.name, bytes: statSync(p).size });
    }
  };
  walk(outDir);
}, 120_000);

afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe('hundred-arms build', () => {
  it('has no playing-card images', () => {
    // Vite names an emitted asset <name>-<hash>.<ext>.
    const cards = files.filter((f) => cardNames.some((c) => f.name.startsWith(`${c}-`)));
    expect(cards.map((f) => f.name)).toEqual([]);
  });

  it(`stays under ${MAX_BYTES / 1024} KB`, () => {
    const total = files.reduce((sum, f) => sum + f.bytes, 0);
    expect(total).toBeLessThanOrEqual(MAX_BYTES);
  });
});
