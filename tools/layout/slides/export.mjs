// Writes a layout definition (docs/design/layout.md) out as slides to move boxes on.
// One slide per scene, at the reference size; each box holds "label id".
// A pptx has one slide size, so each orientation gets its own file:
// layout.pptx when the layout has one orientation, else layout-landscape.pptx and layout-portrait.pptx.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import pptxgen from 'pptxgenjs';

const here = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_LAYOUT = resolve(here, '../../../packages/reader/src/layouts/read-through.layout.json');
const ORIENTATIONS = ['landscape', 'portrait'];
/** Slide px are CSS px: 96 per inch, so 1 px = 9525 EMU exactly. */
export const PX_PER_INCH = 96;

const COLORS = {
  part: { fill: 'DCE9F7', line: '4A7BB5', text: '1F3A5C' },
  mine: { fill: 'FBE3C4', line: 'D9822B', text: '6B3A08' },
  reserved: { fill: 'D9D9D9', line: '8C8C8C', text: '4D4D4D' },
};

/** The alt text that carries a box's part id: Google Slides keeps it through an export, unlike shape names. */
export const ID_PREFIX = 'uzu:';

/** The orientations a layout supports, in a fixed order. */
export function orientationsOf(layout) {
  return ORIENTATIONS.filter((o) => layout.reference?.[o]);
}

/** Builds one presentation for one orientation. Returns the pptxgenjs object. */
export function buildDeck(layout, orientation) {
  const [rw, rh] = layout.reference[orientation];
  const inch = (px) => px / PX_PER_INCH;
  const pptx = new pptxgen();
  pptx.defineLayout({ name: `${layout.screen}-${orientation}`, width: inch(rw), height: inch(rh) });
  pptx.layout = `${layout.screen}-${orientation}`;
  pptx.title = `${layout.screen} ${orientation}`;

  // Text is the label only. A part with `align` carries text: aligned so and anchored in the middle.
  // Any other box (a picture's) keeps its caption at the top left, where boxes drawn over it leave it readable.
  const addBox = (slide, id, label, rect, c, opts = {}) => {
    const [x, y, w, h] = rect;
    const small = w < 80 || h < 30;
    slide.addText(label, {
      x: inch(x), y: inch(y), w: inch(w), h: inch(h),
      shape: pptx.ShapeType.rect,
      fill: { color: c.fill, transparency: opts.transparency ?? 0 },
      line: { color: c.line, width: 1 },
      color: c.text,
      fontSize: small ? 7 : h < 40 ? 8 : 11,
      align: opts.align ?? 'left', valign: opts.valign ?? (opts.align ? 'middle' : 'top'), margin: 2, fit: 'none', wrap: !small,
      objectName: id,
    });
  };

  for (const scene of layout.scenes) {
    const slide = pptx.addSlide();
    slide.addNotes(`${scene.id} ${scene.key} ${scene.label}`);
    for (const id of scene.show) {
      const part = layout.parts[id];
      const rect = part?.[orientation];
      if (!rect) throw new Error(`layout ${layout.screen}: scene "${scene.key}" shows "${id}" with no ${orientation} box`);
      // The background sits bottom right so its text clears the boxes drawn over its top left.
      addBox(slide, id, part.label, rect, scene.mine.includes(id) ? COLORS.mine : COLORS.part, id === 'bg' ? { align: 'right', valign: 'bottom' } : { align: part.align });
    }
    for (const [id, area] of Object.entries(layout.reserved ?? {})) {
      if (area[orientation]) addBox(slide, id, area.label, area[orientation], COLORS.reserved, { transparency: 60, align: area.align });
    }
  }
  return pptx;
}

/**
 * The deck as a pptx file's bytes. pptxgenjs ignores alt text on text shapes, so each shape's part
 * id (its name) is copied into descr="uzu:ID" in the slide XML.
 */
export async function deckBytes(layout, orientation) {
  const zip = await JSZip.loadAsync(await buildDeck(layout, orientation).write({ outputType: 'nodebuffer' }));
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const xml = await zip.file(name).async('string');
    zip.file(name, xml.replace(/<p:cNvPr id="(\d+)" name="([A-Za-z][A-Za-z0-9]*)">/g, `<p:cNvPr id="$1" name="$2" descr="${ID_PREFIX}$2">`));
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** Writes the decks into outDir; returns the file paths written. */
export async function exportLayout(layout, outDir) {
  const orientations = orientationsOf(layout);
  if (orientations.length === 0) throw new Error(`layout ${layout.screen}: no reference size`);
  const written = [];
  for (const o of orientations) {
    const file = join(outDir, orientations.length === 1 ? 'layout.pptx' : `layout-${o}.pptx`);
    writeFileSync(file, await deckBytes(layout, o));
    written.push(file);
  }
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [srcArg, outArg] = process.argv.slice(2);
  const src = srcArg || DEFAULT_LAYOUT;
  const outDir = outArg || '.';
  const layout = JSON.parse(readFileSync(src, 'utf8'));
  for (const f of await exportLayout(layout, outDir)) console.log(f);
}
