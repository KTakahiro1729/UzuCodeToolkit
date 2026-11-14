import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

/** tools/check/compose.py draws a scene the way the screen does; it needs python3 with Pillow, and the test skips without them. */
const SCRIPT = join(__dirname, '../../../tools/check/compose.py');
const py = (args: string[]) => execFileSync('python3', args, { encoding: 'utf8' });
const hasPillow = (() => {
  try {
    py(['-c', 'import PIL']);
    return true;
  } catch {
    return false;
  }
})();

const dir = mkdtempSync(join(tmpdir(), 'compose-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const LAYOUT = {
  screen: 'test',
  reference: { landscape: [100, 200] },
  parts: {
    c1: { label: 'figure', image: 'stand-{role}', landscape: [0, 0, 100, 200] },
    frame: { label: 'frame', image: 'frame', landscape: [0, 0, 10, 10] },
  },
  scenes: [{ id: 1, key: 'one', label: 'one', show: ['c1', 'frame'], mine: [] }],
};

describe('compose.py', () => {
  it.skipIf(!hasPillow)('puts a standing figure at the bottom of its box, contained, and notes a missing picture', () => {
    mkdirSync(join(dir, 'public/assets'), { recursive: true });
    mkdirSync(join(dir, 'script'), { recursive: true });
    writeFileSync(join(dir, 'layout.json'), JSON.stringify(LAYOUT));
    writeFileSync(join(dir, 'script/script.json'), JSON.stringify({ cast: [{ id: 'a', label: 'A' }], lines: [] }));
    // A 50x50 red picture in a 100x200 box: contained it is 100x100, sitting on the bottom edge (y 100-200).
    py(['-c', `from PIL import Image; Image.new('RGB',(50,50),(255,0,0)).save(r'${join(dir, 'public/assets/stand-a.webp')}', lossless=True)`]);
    const out = py([SCRIPT, dir, '--layout', join(dir, 'layout.json'), '--scale', '1', '--out', join(dir, 'out')]);
    expect(out).toContain('01-one-landscape.png');
    expect(out).toContain('frame: assets/frame.webp missing');
    const px = py(['-c', `from PIL import Image; im=Image.open(r'${join(dir, 'out/01-one-landscape.png')}'); print(im.size, im.getpixel((50,150)), im.getpixel((50,60)))`]);
    expect(px.trim()).toBe('(100, 200) (255, 0, 0) (40, 44, 52)');
  });
});
