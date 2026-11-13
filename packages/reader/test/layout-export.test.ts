import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { afterAll, describe, expect, it } from 'vitest';
import { exportLayout, PX_PER_INCH } from '../../../tools/layout/slides/export.mjs';
import { boxIn, orientationsOf, type Orientation, type ScreenLayout } from '../src/layout';
import { READ_THROUGH_LAYOUT } from '../src/stage-layout';

const EMU_PER_PX = 914400 / PX_PER_INCH;
const dir = mkdtempSync(join(tmpdir(), 'layout-export-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

interface Box { x: number; y: number; w: number; h: number; text: string; id: string | undefined; algn: string | undefined }

async function readDeck(file: string): Promise<{ size: [number, number]; slides: Box[][] }> {
  const zip = await JSZip.loadAsync(readFileSync(file));
  const pres = await zip.file('ppt/presentation.xml')!.async('string');
  const sz = /<p:sldSz cx="(\d+)" cy="(\d+)"/.exec(pres)!;
  const names = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const slides: Box[][] = [];
  for (const n of names) {
    const xml = await zip.file(n)!.async('string');
    const boxes: Box[] = [];
    for (const sp of xml.split('<p:sp>').slice(1)) {
      const off = /<a:off x="(\d+)" y="(\d+)"\/><a:ext cx="(\d+)" cy="(\d+)"/.exec(sp)!;
      const text = [...sp.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]).join('');
      const id = /<p:cNvPr [^>]*descr="uzu:([^"]*)"/.exec(sp)?.[1];
      const algn = /<a:pPr algn="(\w+)"/.exec(sp)?.[1];
      boxes.push({ id, algn, x: +off[1] / EMU_PER_PX, y: +off[2] / EMU_PER_PX, w: +off[3] / EMU_PER_PX, h: +off[4] / EMU_PER_PX, text });
    }
    slides.push(boxes);
  }
  return { size: [+sz[1] / EMU_PER_PX, +sz[2] / EMU_PER_PX], slides };
}

function expectBoxes(layout: ScreenLayout, o: Orientation, slides: Box[][]): void {
  layout.scenes.forEach((scene, i) => {
    const wanted = [
      ...scene.show.slice(0, 1).map((id) => ({ id, rect: boxIn(layout, scene, id, o) })),
      ...Object.entries(layout.reserved ?? {}).filter(([, a]) => a[o]).map(([id, a]) => ({ id, rect: a[o]! })),
      ...scene.show.slice(1).map((id) => ({ id, rect: boxIn(layout, scene, id, o) })),
    ];
    expect(slides[i]).toHaveLength(wanted.length);
    wanted.forEach(({ id, rect }, j) => {
      const b = slides[i]![j]!;
      expect([b.x, b.y, b.w, b.h].map(Math.round)).toEqual([...rect]);
      expect(b.id).toBe(id);
      expect(b.text).not.toContain(id);
      expect(b.text).not.toMatch(/\d+×\d+/);
    });
  });
}

describe('layout export to slides', () => {
  it('writes one slide per scene, at the reference size, boxes where the JSON puts them', async () => {
    const files = await exportLayout(READ_THROUGH_LAYOUT, dir);
    const orientations = orientationsOf(READ_THROUGH_LAYOUT);
    expect(files).toHaveLength(orientations.length);
    for (const [k, o] of orientations.entries()) {
      const deck = await readDeck(files[k]!);
      expect(deck.slides).toHaveLength(READ_THROUGH_LAYOUT.scenes.length);
      expect(deck.size.map(Math.round)).toEqual([...READ_THROUGH_LAYOUT.reference[o]!]);
      expectBoxes(READ_THROUGH_LAYOUT, o, deck.slides);
    }
  });

  it('a layout with one orientation gives one layout.pptx of six slides', async () => {
    const landscape: ScreenLayout = JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT));
    delete landscape.reference.portrait;
    for (const p of Object.values(landscape.parts)) delete p.portrait;
    const sub = mkdtempSync(join(dir, 'one-'));
    const files = await exportLayout(landscape, sub);
    expect(files).toEqual([join(sub, 'layout.pptx')]);
    const deck = await readDeck(files[0]!);
    expect(deck.slides).toHaveLength(6);
    expectBoxes(landscape, 'landscape', deck.slides);
  });

  it('reserved areas come right after the background with a dashed outline and no fill; parts are opaque in show order', async () => {
    const files = await exportLayout(READ_THROUGH_LAYOUT, dir);
    const zip = await JSZip.loadAsync(readFileSync(files[0]!));
    const sps = (await zip.file('ppt/slides/slide1.xml')!.async('string')).split('<p:sp>').slice(1);
    const reserved = Object.keys(READ_THROUGH_LAYOUT.reserved ?? {});
    const ids = sps.map((sp) => /descr="uzu:([^"]*)"/.exec(sp)![1]);
    const [bg, ...rest] = READ_THROUGH_LAYOUT.scenes[0]!.show;
    expect(bg).toBe('bg');
    expect(ids).toEqual(['bg', ...reserved, ...rest]);
    sps.forEach((sp, i) => {
      const isReserved = i >= 1 && i <= reserved.length;
      expect(sp.includes('<a:prstDash val="dash"/>')).toBe(isReserved);
      expect(/<p:spPr>.*?<\/p:spPr>/s.exec(sp)![0].includes('<a:solidFill><a:srgbClr val="')).toBe(true);
      expect(sp.includes('<a:alpha')).toBe(false);
      expect(/<a:xfrm>.*?<\/a:xfrm><a:prstGeom prst="rect"><a:avLst><\/a:avLst><\/a:prstGeom><a:solidFill>/s.test(sp)).toBe(!isReserved);
    });
    const tag = sps.find((sp) => sp.includes('uzu:tag"'))!;
    expect(tag).toContain('wrap="none"');
    expect(tag).toContain('sz="700"');
    expect(tag).toContain('<a:t>状況（日付・時間・章）</a:t>');
  });

  it("captions of pictures sit centred in their upper area; the frame's at its bottom", async () => {
    const files = await exportLayout(READ_THROUGH_LAYOUT, dir);
    const xml = await (await JSZip.loadAsync(readFileSync(files[0]!))).file('ppt/slides/slide1.xml')!.async('string');
    const sp = (id: string) => xml.split('<p:sp>').find((s) => s.includes(`uzu:${id}"`))!;
    expect(sp('c1')).toMatch(/algn="ctr"/);
    expect(sp('c1')).toMatch(/anchor="t"/);
    expect(+/tIns="(\d+)"/.exec(sp('c1'))![1]).toBeGreaterThan(12700 * 10);
    expect(sp('frame')).toMatch(/algn="ctr"/);
    expect(sp('frame')).toMatch(/anchor="b"/);
  });

  it("a scene's own box overrides the part's box on that slide", async () => {
    const layout: ScreenLayout = JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT));
    layout.scenes[0]!.boxes = { next: { landscape: [10, 20, 30, 40] } };
    const [file] = await exportLayout(layout, mkdtempSync(join(dir, 'scene-')));
    const deck = await readDeck(file!);
    const next = deck.slides[0]!.find((b) => b.id === 'next')!;
    expect([next.x, next.y, next.w, next.h].map(Math.round)).toEqual([10, 20, 30, 40]);
    expect(deck.slides[1]!.find((b) => b.id === 'next')).toBeUndefined();
  });

  it("a part's align sets the box's text alignment, anchored in the middle", async () => {
    const layout: ScreenLayout = JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT));
    (layout.parts.next as { align?: string }).align = 'center';
    (layout.parts.frame as { align?: string }).align = 'right';
    const sub = mkdtempSync(join(dir, 'align-'));
    const [file] = await exportLayout(layout, sub);
    const deck = await readDeck(file!);
    const box = (id: string) => deck.slides[0]!.find((b) => b.id === id)!;
    expect(box('next').algn).toBe('ctr');
    expect(box('frame').algn).toBe('r');
    expect(box('plate1').algn).toBe('l');
    const xml = await (await JSZip.loadAsync(readFileSync(file!))).file('ppt/slides/slide1.xml')!.async('string');
    expect(xml).toContain('anchor="ctr"');
    const c1 = xml.split('<p:sp>').find((sp) => sp.includes('descr="uzu:c1"'))!;
    expect(c1).toContain('anchor="t"');
  });
});
