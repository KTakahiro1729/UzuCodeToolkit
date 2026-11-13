import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { afterAll, describe, expect, it } from 'vitest';
import { exportLayout, PX_PER_INCH } from '../../../tools/layout/slides/export.mjs';
import { orientationsOf, rectOf, type Orientation, type ScreenLayout } from '../src/layout';
import { READ_THROUGH_LAYOUT } from '../src/stage-layout';

const EMU_PER_PX = 914400 / PX_PER_INCH;
const dir = mkdtempSync(join(tmpdir(), 'layout-export-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

interface Box { x: number; y: number; w: number; h: number; text: string }

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
      boxes.push({ x: +off[1] / EMU_PER_PX, y: +off[2] / EMU_PER_PX, w: +off[3] / EMU_PER_PX, h: +off[4] / EMU_PER_PX, text });
    }
    slides.push(boxes);
  }
  return { size: [+sz[1] / EMU_PER_PX, +sz[2] / EMU_PER_PX], slides };
}

function expectBoxes(layout: ScreenLayout, o: Orientation, slides: Box[][]): void {
  layout.scenes.forEach((scene, i) => {
    const wanted = [
      ...scene.show.map((id) => ({ id, rect: rectOf(layout, id, o) })),
      ...Object.entries(layout.reserved ?? {}).filter(([, a]) => a[o]).map(([id, a]) => ({ id, rect: a[o]! })),
    ];
    expect(slides[i]).toHaveLength(wanted.length);
    wanted.forEach(({ id, rect }, j) => {
      const b = slides[i]![j]!;
      expect([b.x, b.y, b.w, b.h].map(Math.round)).toEqual([...rect]);
      expect(b.text.split(' ')).toContain(id);
      expect(b.text.endsWith(`${rect[2]}×${rect[3]}`)).toBe(true);
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
});
