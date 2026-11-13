import PptxGenJS from 'pptxgenjs';
import { describe, expect, it } from 'vitest';
import { applyMoves, importSlides, reportOf, type ImportLayout } from '../../../tools/layout/slides/import.mjs';

/** A 400×200 reference screen drawn at 4×2 in, so 1 px is 0.01 in. */
const layout: ImportLayout = {
  screen: 'test',
  reference: { landscape: [400, 200] },
  parts: {
    frame: { label: 'Frame', landscape: [20, 100, 360, 80] },
    next: { label: 'Next', landscape: [300, 150, 80, 30] },
    plate: { label: 'Plate', landscape: [20, 70, 100, 20] },
  },
  reserved: { logo: { label: 'Logo', landscape: [10, 5, 20, 20] } },
  scenes: [
    { id: 1, key: 'one', show: ['frame', 'next', 'plate'], mine: [] },
    { id: 2, key: 'two', show: ['frame', 'next', 'plate'], mine: [] },
  ],
};

type Box = [text: string, x: number, y: number, w: number, h: number];
const original = (skip: string[] = []): Box[] =>
  [
    ['# scene one', 0, 0, 100, 10],
    ['Logo logo 20×20', 10, 5, 20, 20],
    ['Frame frame 360×80', 20, 100, 360, 80],
    ['Next next 80×30', 300, 150, 80, 30],
    ['Plate plate 100×20', 20, 70, 100, 20],
  ].filter((b) => !skip.includes((b[0] as string).split(' ')[1] ?? '')) as Box[];

async function deck(slides: Box[][], size: [number, number] = [4, 2]): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'T', width: size[0], height: size[1] });
  pptx.layout = 'T';
  for (const boxes of slides) {
    const slide = pptx.addSlide();
    for (const [text, x, y, w, h] of boxes) slide.addText(text, { x: x / 100, y: y / 100, w: w / 100, h: h / 100 });
  }
  return (await pptx.write({ outputType: 'nodebuffer' })) as Buffer;
}

const edit = (boxes: Box[], id: string, to: [number, number, number, number]): Box[] =>
  boxes.map((b) => (b[0].split(' ')[1] === id ? ([b[0], ...to] as Box) : b));

describe('reading edited slides back into a layout', () => {
  it('finds nothing to change in slides that were not edited', async () => {
    const r = await importSlides(layout, await deck([original(), original()]));
    expect(reportOf(r)).toBe('no changes');
    expect(r.layout).toEqual(layout);
  });

  it('applies a move made on one slide', async () => {
    const r = await importSlides(layout, await deck([edit(original(), 'next', [260, 140, 100, 40]), original()]));
    expect(r.moved).toEqual([{ id: 'next', orientation: 'landscape', from: [300, 150, 80, 30], to: [260, 140, 100, 40] }]);
    expect(r.layout.parts.next!.landscape).toEqual([260, 140, 100, 40]);
    expect(layout.parts.next!.landscape).toEqual([300, 150, 80, 30]);
  });

  it('applies a move made the same way on two slides, and ignores rounding', async () => {
    const moved = edit(original(), 'plate', [30, 60, 100, 20]);
    const r = await importSlides(layout, await deck([moved, edit(moved, 'plate', [30.4, 60.3, 100, 20])]));
    expect(r.moved.map((m) => m.to)).toEqual([[30, 60, 100, 20]]);
    expect(r.conflicts).toEqual([]);
  });

  it('reports a part moved to different places on two slides, and does not apply it', async () => {
    const r = await importSlides(layout, await deck([edit(original(), 'next', [260, 140, 80, 30]), edit(original(), 'next', [240, 140, 80, 30])]));
    expect(r.moved).toEqual([]);
    expect(r.layout.parts.next!.landscape).toEqual([300, 150, 80, 30]);
    expect(r.conflicts).toEqual([
      {
        id: 'next',
        orientation: 'landscape',
        places: [
          { scene: 'one', slide: 1, rect: [260, 140, 80, 30] },
          { scene: 'two', slide: 2, rect: [240, 140, 80, 30] },
        ],
      },
    ]);
  });

  it('lists a box with no known id as a new part, and a copy of a box as a new part too', async () => {
    const withNew: Box[] = [...original(), ['Help', 20, 20, 50, 20], ['Next next 80×30', 200, 150, 80, 30]];
    const r = await importSlides(layout, await deck([withNew, original()]));
    expect(r.added).toEqual([
      { orientation: 'landscape', scene: 'one', slide: 1, text: 'Help', rect: [20, 20, 50, 20] },
      { orientation: 'landscape', scene: 'one', slide: 1, text: 'next', copyOf: 'next', rect: [200, 150, 80, 30] },
    ]);
    expect(r.moved).toEqual([]);
  });

  it('lists a part gone from a scene that shows it, and leaves the layout alone', async () => {
    const r = await importSlides(layout, await deck([original(), original(['plate'])]));
    expect(r.removed).toEqual([{ orientation: 'landscape', scene: 'two', slide: 2, id: 'plate' }]);
    expect(r.layout).toEqual(layout);
  });

  it('does not treat captions or the UZU areas as parts', async () => {
    const r = await importSlides(layout, await deck([edit(original(), 'logo', [50, 50, 20, 20]), original()]));
    expect(reportOf(r)).toBe('no changes');
  });

  it('reads nothing when the slide count does not fit the scenes, or the shape fits no screen', async () => {
    const few = await importSlides(layout, await deck([original()]));
    expect(few.problems).toHaveLength(1);
    expect(few.moved).toEqual([]);
    const tall = await importSlides(layout, await deck([original(), original()], [2, 4]));
    expect(tall.problems[0]).toContain('matches no reference screen');
  });

  it('writes moves into the layout text line by line, keeping its look', () => {
    const text = '{\n  "parts": {\n    "next": { "label": "Next", "landscape": [300, 150, 80, 30] },\n    "frame": { "label": "F", "landscape": [1, 2, 3, 4] }\n  }\n}\n';
    const moved = [{ id: 'next', orientation: 'landscape', from: [300, 150, 80, 30], to: [260, 140, 100, 40] }];
    expect(applyMoves(text, moved, layout)).toBe(text.replace('[300, 150, 80, 30]', '[260, 140, 100, 40]'));
    expect(applyMoves('{"parts":{}}', moved, layout)).toBe(JSON.stringify(layout, null, 2) + '\n');
  });
});
