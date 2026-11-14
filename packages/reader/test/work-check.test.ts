import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
// @ts-expect-error the types sit beside it, but the config's module resolution does not pick up .d.mts here
import { allPhases } from '../../../tools/e2e/all-phases.mjs';
import { FONT_FILES } from '../../../tools/fonts/fonts.mjs';
import { checkWork } from '../../../tools/check/static.mjs';

/**
 * Each static check fails a small work that is broken on purpose in that one way, and a work with
 * none of the defects passes. The runtime check (a seat that has left) plays real works in the dev harness.
 */
const roots: string[] = [];
const FILES = {
  'manifest.json': JSON.stringify({ orientation: 'landscape', serverActionLogicPath: './src/logic.ts', characters: [] }),
  'index.html': '<!doctype html><html><body><script type="module" src="./src/main.ts"></script></body></html>',
  'src/main.ts': "import { startFlow } from '@uzu-toolkit/reader';\nstartFlow(logic, { orientation: 'landscape' });\n",
  'src/logic.ts': "export default { setup: () => ({}), actions: {} };\n",
};
/** A small good work with `changes` applied (a file set to null is removed). */
const work = (changes: Record<string, string | Buffer | null> = {}) => {
  const dir = mkdtempSync(join(tmpdir(), 'work-check-'));
  roots.push(dir);
  for (const [f, text] of Object.entries({ ...FILES, ...changes })) {
    if (text === null) continue;
    mkdirSync(dirname(join(dir, f)), { recursive: true });
    writeFileSync(join(dir, f), text);
  }
  return dir;
};
afterAll(() => roots.forEach((d) => rmSync(d, { recursive: true, force: true })));
const rules = (list: { rule: string }[]) => list.map((f) => f.rule);

describe('static checks', () => {
  it('pass a small good work, with no warning but the missing toolkit part', () => {
    const { errors, warnings } = checkWork(work());
    expect(errors).toEqual([]);
    expect(rules(warnings)).toEqual([]);
  });

  it('fails a work that never calls firstFrameReady', () => {
    expect(rules(checkWork(work({ 'src/main.ts': 'console.log(1);\n' })).errors)).toEqual(['first-frame']);
    expect(checkWork(work({ 'src/main.ts': "import { firstFrameReady } from '@uzuhq/code-sdk';\nrequestAnimationFrame(() => firstFrameReady());\n" })).errors).toEqual([]);
  });

  it('fails Date.now and Math.random in the server logic and what it imports, not in the client', () => {
    expect(rules(checkWork(work({ 'src/logic.ts': 'export const t = () => Date.now();\n' })).errors)).toEqual(['nondeterminism']);
    const viaImport = { 'src/logic.ts': "import { roll } from './dice';\nexport default roll;\n", 'src/dice.ts': 'export const roll = () => Math.random();\n' };
    expect(rules(checkWork(work(viaImport)).errors)).toEqual(['nondeterminism']);
    expect(checkWork(work({ 'src/view.ts': 'export const t = Date.now();\n' })).errors).toEqual([]);
  });

  it('ignores a use in a comment, and a line that says uzu-check-ignore', () => {
    expect(checkWork(work({ 'src/logic.ts': '// not Math.random()\nexport default 1;\n' })).errors).toEqual([]);
    expect(checkWork(work({ 'src/logic.ts': 'export const t = Date.now(); // uzu-check-ignore: a log line\n' })).errors).toEqual([]);
  });

  it('fails a file name outside A-Z a-z 0-9 _ - .', () => {
    expect(rules(checkWork(work({ 'public/assets/アイコン.webp': 'x' })).errors)).toEqual(['file-name']);
    expect(rules(checkWork(work({ 'public/assets/my icon.webp': 'x' })).errors)).toEqual(['file-name']);
    expect(checkWork(work({ 'public/assets/icon-1_a.webp': 'x' })).errors).toEqual([]);
  });

  it('fails an outside address, but not a namespace or a comment', () => {
    expect(rules(checkWork(work({ 'src/api.ts': "export const u = 'https://example.com/x.json';\n" })).errors)).toEqual(['external-url']);
    expect(rules(checkWork(work({ 'src/a.css': "@import url('https://fonts.googleapis.com/css2?family=X');\n" })).errors)).toEqual(['external-url']);
    expect(checkWork(work({ 'src/a.svg.ts': "export const ns = 'http://www.w3.org/2000/svg'; // see https://example.com\n" })).errors).toEqual([]);
  });

  it('fails an absolute path', () => {
    expect(rules(checkWork(work({ 'index.html': '<img src="/assets/a.png">' })).errors)).toEqual(['absolute-path']);
    expect(rules(checkWork(work({ 'src/a.css': '.a { background: url(/assets/a.png); }\n' })).errors)).toEqual(['absolute-path']);
    expect(checkWork(work({ 'src/a.css': '.a { background: url(./a.png); }\n' })).errors).toEqual([]);
  });

  it('fails a lock or a rotation of the screen, and an orientation that differs from the manifest', () => {
    expect(rules(checkWork(work({ 'src/lock.ts': "screen.orientation.lock('landscape');\n" })).errors)).toEqual(['orientation']);
    expect(rules(checkWork(work({ 'src/a.css': 'body { transform: rotate(90deg); }\n' })).errors)).toEqual(['orientation']);
    expect(rules(checkWork(work({ 'src/main.ts': "import { startFlow } from '@uzu-toolkit/reader';\nstartFlow(logic, { orientation: 'portrait' });\n" })).errors)).toEqual(['orientation']);
    expect(rules(checkWork(work({ 'manifest.json': JSON.stringify({ orientation: 'sideways' }) })).errors)).toEqual(['orientation']);
    // The manifest's own orientation is the right way, not a defect.
    expect(checkWork(work({ 'manifest.json': JSON.stringify({ orientation: 'portrait', serverActionLogicPath: './src/logic.ts' }), 'src/main.ts': "startFlow(logic, { orientation: 'portrait' });\n" })).errors).toEqual([]);
  });
});

describe('static warnings never fail the check', () => {
  it('warns of a portrait work with no max-width and of fixed px sizes', () => {
    const portrait = work({ 'manifest.json': JSON.stringify({ orientation: 'portrait' }), 'src/main.ts': 'startFlow(logic);\n' });
    expect(rules(checkWork(portrait).warnings)).toContain('no-max-width');
    expect(checkWork(work({ 'manifest.json': '{}' })).warnings).toEqual([]);
    const px = checkWork(work({ 'src/a.css': '.a { font-size: 14px; border: 1px solid; }\n' }));
    expect(px.errors).toEqual([]);
    expect(rules(px.warnings)).toEqual(['px-fixed']);
    expect(checkWork(work({ 'src/main.ts': 'firstFrameReady();\n' })).warnings).toEqual([]);
  });
  it('does not warn of a 1px line or px in a border', () => {
    expect(checkWork(work({ 'src/a.css': '.a { border: 2px solid; width: 1px; }\n' })).warnings).toEqual([]);
  });
});

describe('text no font subset holds', () => {
  const subsets = (name: string) => readFileSync(resolve(__dirname, '../../../samples/hundred-arms/src/fonts', name));
  const withFonts = (changes: Record<string, string | null> = {}) => {
    const dir = work({ 'fonts.config.json': JSON.stringify({ out: 'src/fonts' }), ...changes });
    mkdirSync(join(dir, 'src/fonts'), { recursive: true });
    for (const n of [...FONT_FILES.story, ...FONT_FILES.ui]) writeFileSync(join(dir, 'src/fonts', n), subsets(n));
    return dir;
  };
  it('warns of a character in a data file or a screen that the subsets lack, and only warns', () => {
    const data = checkWork(withFonts({ 'script/lines.json': JSON.stringify({ lines: [{ text: '龘' }] }) }));
    expect(data.errors).toEqual([]);
    expect(data.warnings.filter((w) => w.rule === 'font-glyph').map((w) => w.file)).toEqual(['script/lines.json']);
    const view = checkWork(withFonts({ 'src/View.svelte': '<p>鬱</p>\n' }));
    expect(view.warnings.filter((w) => w.rule === 'font-glyph').map((w) => w.file)).toEqual(['src/View.svelte']);
  });
  it('stays quiet for held characters, a comment, and a work with no fonts.config.json', () => {
    const quiet = checkWork(withFonts({ 'script/lines.json': JSON.stringify({ t: '百' }), 'src/View.svelte': '<!-- 鬱 -->\n<p>百</p>\n' }));
    expect(quiet.warnings.filter((w) => w.rule === 'font-glyph')).toEqual([]);
    expect(checkWork(work({ 'script/lines.json': JSON.stringify({ t: '龘' }) })).warnings).toEqual([]);
  });
});

describe('a seat that has left', () => {
  const fixture = (name: string) => resolve(__dirname, '../../../tools/check/fixtures', name);
  const phases = [{ id: 'first' }, { id: 'second' }];
  it('lets a work whose every phase anyone can move on finish', { timeout: 120_000 }, () => allPhases({ phases, cwd: fixture('ok'), away: 'b' }));
  it('fails a work whose phase only the seat that left can move on, naming the phase', { timeout: 120_000 }, async () => {
    // With everyone there, b moves the second phase on.
    const second = async ({ seats, send }: { seats: { part: string }[]; send: (s: unknown, n: string) => Promise<void> }) => send(seats.find((s) => s.part === 'b'), 'next');
    await allPhases({ phases, cwd: fixture('stuck'), drive: { second } });
    // With b gone, the others cannot (their `next` is rejected).
    await expect(allPhases({ phases, cwd: fixture('stuck'), away: 'b' })).rejects.toThrow(/phase second: next from a changed nothing.*with b away/);
  });

  describe('pictures', () => {
    /** A WebP header the check can read (lossless, with or without alpha); the pixels are not there. */
    const webp = (w: number, h: number, alpha = true): Buffer => {
      const b = Buffer.alloc(30);
      b.write('RIFF', 0, 'latin1');
      b.writeUInt32LE(22, 4);
      b.write('WEBPVP8L', 8, 'latin1');
      b.writeUInt32LE(10, 16);
      b[20] = 0x2f;
      b.writeUInt32LE(((w - 1) | ((h - 1) << 14) | ((alpha ? 1 : 0) << 28)) >>> 0, 21);
      return b;
    };
    const SET: [string, number, number, boolean][] = [
      ['bg', 1748, 804, false],
      ['frame', 1476, 280, true],
      ['frame-mine', 1476, 280, true],
      ['plate', 380, 64, true],
      ['plate-mine', 380, 64, true],
      ['button', 240, 88, true],
      ['panel', 1476, 634, true],
      ['stand-a', 700, 772, true],
    ];
    const SCRIPT = JSON.stringify({ cast: [{ id: 'a', label: 'A' }, { id: 'n', label: 'N', direction: true }], lines: [] });
    const pictures = (set: typeof SET) => ({
      'script/script.json': SCRIPT,
      ...Object.fromEntries(set.map(([n, w, h, a]) => [`public/assets/${n}.webp`, webp(w, h, a)])),
    });
    const files = work;

    it('ask nothing of a work with no picture, and of one with the whole set', () => {
      expect(rules(checkWork(files({ 'script/script.json': SCRIPT })).errors)).toEqual([]);
      const r = checkWork(files(pictures(SET)));
      expect(r.errors).toEqual([]);
      expect(r.warnings).toEqual([]);
    });
    it('name what a half-made set lacks', () => {
      const r = checkWork(files(pictures(SET.filter(([n]) => n === 'bg' || n === 'frame'))));
      expect(rules(r.errors)).toEqual(['picture-missing']);
      for (const n of ['stand-a', 'plate', 'plate-mine', 'button', 'panel', 'frame-mine']) expect(r.errors[0].message).toContain(`${n}.webp`);
      expect(r.errors[0].message).not.toContain('stand-n');
    });
    it('warn of a stretched picture and of a part with no alpha', () => {
      const r = checkWork(files(pictures(SET.map(([n, w, h, a]) => (n === 'frame' ? [n, 1200, 220, a] : n === 'button' ? [n, w, h, false] : [n, w, h, a])))));
      expect(r.errors).toEqual([]);
      expect(r.warnings.map((f) => `${f.rule}`).sort()).toEqual(['picture-alpha', 'picture-ratio']);
    });
  });
});
