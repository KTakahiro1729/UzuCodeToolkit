import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buildBrief, DEFAULT_LAYOUT, imageList, pickOrientation } from '../../../tools/layout/brief/brief.mjs';

const layout = JSON.parse(readFileSync(DEFAULT_LAYOUT, 'utf8'));

describe('image order sheet', () => {
  it('the sheet kept in docs/ is the one the tool writes (npm run layout:brief -- --out docs/image-brief/read-through.md)', () => {
    const kept = readFileSync(new URL('../../../docs/image-brief/read-through.md', import.meta.url), 'utf8');
    expect(kept).toBe(buildBrief(layout));
  });

  it('the sheet stands alone: it names no command and says the design policy is out of scope', () => {
    const sheet = buildBrief(layout);
    expect(sheet).not.toMatch(/npm |node |\.mjs/);
    expect(sheet).toContain('デザイン方針の文書は、機能面の決まりであり、この発注書の対象外');
  });

  it('the world text goes into the world hole', () => {
    const sheet = buildBrief(layout, { world: '星間航行ボドゲ部。星図と真鍮の部室。' });
    expect(sheet).toContain('## 【世界観】\n\n星間航行ボドゲ部。星図と真鍮の部室。\n');
    expect(sheet).not.toContain('ここに作品の世界観を書く');
  });

  it('portrait is made only when asked', () => {
    expect(pickOrientation(layout)).toBe('landscape');
    expect(pickOrientation(layout, 'portrait')).toBe('portrait');
    expect(buildBrief(layout, { orientation: 'portrait' })).toContain('（portrait）');
    expect(() => pickOrientation({ ...layout, reference: { landscape: [10, 10] } }, 'portrait')).toThrow();
  });

  it('lists one file per image, at twice its largest box (a standing character: twice the tallest box)', () => {
    const files = Object.fromEntries(imageList(layout, 'landscape').map((i) => [i.file, [i.width, i.height]]));
    expect(files).toEqual({
      'assets/bg.webp': [1748, 804],
      'assets/stand-{role}.webp': [326, 692],
      'assets/frame.webp': [1476, 280],
      'assets/frame-mine.webp': [1476, 280],
      'assets/plate.webp': [380, 64],
      'assets/plate-mine.webp': [380, 64],
      'assets/button.webp': [240, 88],
      'assets/panel.webp': [1476, 634],
    });
  });

  it('orders a your-colour variant of each image a part takes your colour from, and no other', () => {
    const list = imageList(layout, 'landscape');
    expect(list.filter((i) => i.mineOf).map((i) => [i.file, i.mineOf])).toEqual([
      ['assets/frame-mine.webp', 'assets/frame.webp'],
      ['assets/plate-mine.webp', 'assets/plate.webp'],
    ]);
  });

  it('asks for alpha PNGs, with no workaround for opaque output', () => {
    const sheet = buildBrief(layout);
    expect(sheet).toContain('アルファ（透過）付きの PNG');
    expect(sheet).not.toContain('#00FF00');
  });

  it('only the nameplate stretches, and only the full-screen image is opaque', () => {
    const list = imageList(layout, 'landscape');
    expect(list.filter((i) => i.stretch).map((i) => i.image)).toEqual(['plate', 'plate-mine']);
    expect(list.filter((i) => i.opaque).map((i) => i.image)).toEqual(['bg']);
  });

  it('every scene names its reserved areas and keeps text out of the pictures', () => {
    const sheet = buildBrief(layout);
    expect(sheet.match(/UZUのHUD/g)).toHaveLength(layout.scenes.length);
    expect(sheet.match(/すべての文字、数字、目印線を絵に残さない/g)).toHaveLength(layout.scenes.length);
  });
});
