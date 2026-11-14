// Writes a layout definition (docs/design/layout.md) out as slides to move boxes on.
// One slide per scene, at the reference size; each box holds "label id".
// A pptx has one slide size, so each orientation gets its own file:
// layout.pptx when the layout has one orientation, else layout-landscape.pptx and layout-portrait.pptx.
// With --images <dir>, a box whose part has a picture there (<dir>/<image>.png) is filled with it;
// the box stays the part's own shape, so moving, resizing or swapping the picture reads back as before.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import pptxgen from 'pptxgenjs';

const here = dirname(fileURLToPath(import.meta.url));
// In the toolkit's repository the reader is at packages/reader; installed, it sits beside the toolkit package.
const LAYOUTS = ['../../../packages/reader/src/layouts', '../../../../reader/src/layouts'].map((d) => resolve(here, d, 'read-through.layout.json'));
export const DEFAULT_LAYOUT = LAYOUTS.find(existsSync) ?? LAYOUTS[0];
const ORIENTATIONS = ['landscape', 'portrait'];
/** Slide px are CSS px: 96 per inch, so 1 px = 9525 EMU exactly. */
export const PX_PER_INCH = 96;

// Every part is opaque and drawn back to front, so what is in front visibly covers what is behind.
// One fill per kind of part; a part that takes your colour in the scene is orange.
const COLORS = {
  background: { fill: 'EEF2E8', line: '8A9A7B', text: '4B5A3E' },
  character: { fill: 'E4DAF0', line: '7B5EA7', text: '3E2A63' },
  frame: { fill: 'FFF6D6', line: 'B8963A', text: '6B5210' },
  text: { fill: 'FFFFFF', line: '4A7BB5', text: '1F3A5C' },
  part: { fill: 'DCE9F7', line: '4A7BB5', text: '1F3A5C' },
  mine: { fill: 'FBE3C4', line: 'D9822B', text: '6B3A08' },
};
const RESERVED = { line: '8C8C8C', text: '6B6B6B' };

/** Which fill and caption place a part gets, from what it is (its id or image), not from the work. */
function kindOf(id, part) {
  if (id === 'bg') return 'background';
  if (/^stand-/.test(part.image ?? '')) return 'character';
  if (part.image === 'frame' || part.image === 'panel') return 'frame';
  if (part.align && !part.image) return 'text';
  return 'part';
}

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

  // Text is the label only. Where it sits keeps it readable under the boxes drawn over it:
  // a part with `align` carries text, so it is aligned so and anchored in the middle; a character's
  // caption is centred in its upper area (under the face); the frame's is centred at its bottom,
  // between the log and next buttons; the background's is bottom right.
  const addBox = (slide, id, label, rect, c, caption = {}, extra = {}) => {
    const [x, y, w, h] = rect;
    const small = w < 80 || h < 30;
    const [align, valign] = caption.at;
    slide.addText(label, {
      x: inch(x), y: inch(y), w: inch(w), h: inch(h),
      shape: pptx.ShapeType.rect,
      ...(c.fill ? { fill: { color: c.fill } } : {}),
      line: { color: c.line, width: 1, ...(extra.dash ? { dashType: 'dash' } : {}) },
      color: c.text,
      fontSize: small ? 7 : h < 40 ? 8 : 11,
      align, valign, margin: [2, 2, 2, (caption.topInset ?? 0) * h * 0.75 + 2], fit: 'none', wrap: !small,
      objectName: id,
    });
  };

  for (const scene of layout.scenes) {
    const slide = pptx.addSlide();
    slide.addNotes(`${scene.id} ${scene.key} ${scene.label}`);
    const addPart = (id) => {
      const part = layout.parts[id];
      const rect = scene.boxes?.[id]?.[orientation] ?? part?.[orientation];
      if (!rect) throw new Error(`layout ${layout.screen}: scene "${scene.key}" shows "${id}" with no ${orientation} box`);
      const kind = kindOf(id, part);
      const c = scene.mine.includes(id) ? COLORS.mine : COLORS[kind];
      const caption = {
        background: { at: ['right', 'bottom'] },
        character: { at: [part.align ?? 'center', 'top'], topInset: 0.3 },
        frame: { at: [part.align ?? 'center', 'bottom'] },
        text: { at: [part.align, 'middle'] },
        part: { at: [part.align ?? 'left', part.align ? 'middle' : 'top'] },
      }[kind];
      addBox(slide, id, part.label, rect, c, caption);
    };
    const bgIds = scene.show.filter((id) => kindOf(id, layout.parts[id]) === 'background');
    bgIds.forEach(addPart);
    // UZU's own areas sit over the background and behind every part: dashed outline, no fill.
    for (const [id, area] of Object.entries(layout.reserved ?? {})) {
      if (area[orientation]) addBox(slide, id, area.label, area[orientation], RESERVED, { at: [area.align ?? 'left', 'top'] }, { dash: true });
    }
    scene.show.filter((id) => !bgIds.includes(id)).forEach(addPart);
  }
  return pptx;
}

/**
 * The picture file for a part in a scene, or undefined: `<image>.png` in `dir`, `<image>-mine.png`
 * when the scene paints the part as yours, and for `{role}` (the speaker's standing picture) the
 * first `stand-*.png` there is: a slide is a place, not a role.
 */
function pictureFor(dir, part, mine) {
  if (!dir || !part?.image) return undefined;
  const stands = () => readdirSync(dir).filter((f) => /^stand-.*\.png$/.test(f) && !/-mine\.png$/.test(f)).sort();
  const base = part.image.includes('{role}') ? stands()[0]?.replace(/\.png$/, '') : part.image;
  if (!base) return undefined;
  for (const name of mine ? [`${base}-mine`, base] : [base]) if (existsSync(join(dir, `${name}.png`))) return join(dir, `${name}.png`);
  return undefined;
}

/**
 * The deck as a pptx file's bytes. pptxgenjs ignores alt text on text shapes, so each shape's part
 * id (its name) is copied into descr="uzu:ID" in the slide XML. With `imagesDir`, a part's box is
 * filled with its picture (a picture fill of the same shape, not a picture shape: the box stays the
 * part, whatever the author does to the picture).
 */
export async function deckBytes(layout, orientation, imagesDir) {
  const zip = await JSZip.loadAsync(await buildDeck(layout, orientation).write({ outputType: 'nodebuffer' }));
  const media = new Map();
  for (const name of Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))) {
    const scene = layout.scenes[Number(name.match(/(\d+)\.xml$/)[1]) - 1];
    const relName = name.replace('slides/', 'slides/_rels/') + '.rels';
    let rels = await zip.file(relName).async('string');
    let n = 0;
    const xml = (await zip.file(name).async('string'))
      .replace(/<p:cNvPr id="(\d+)" name="([A-Za-z][A-Za-z0-9]*)">/g, `<p:cNvPr id="$1" name="$2" descr="${ID_PREFIX}$2">`)
      .replace(/<p:sp>[\s\S]*?<\/p:sp>/g, (sp) => {
        const id = sp.match(/descr="uzu:([^"]+)"/)?.[1];
        const file = id && pictureFor(imagesDir, layout.parts[id], scene?.mine.includes(id));
        if (!file) return sp;
        const target = `uzu-${file.split(/[\\/]/).pop()}`;
        if (!media.has(target)) media.set(target, readFileSync(file));
        const rid = `rIdUzu${++n}`;
        rels = rels.replace('</Relationships>', `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/${target}"/></Relationships>`);
        return sp.replace(/(<\/a:prstGeom>)<a:solidFill>[\s\S]*?<\/a:solidFill>/, `$1<a:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></a:blipFill>`);
      });
    zip.file(name, xml);
    zip.file(relName, rels);
  }
  for (const [target, bytes] of media) zip.file(`ppt/media/${target}`, bytes);
  if (media.size) {
    const ct = await zip.file('[Content_Types].xml').async('string');
    if (!/Extension="png"/.test(ct)) zip.file('[Content_Types].xml', ct.replace(/<Override/, '<Default Extension="png" ContentType="image/png"/><Override'));
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

/** Writes the decks into outDir; returns the file paths written. */
export async function exportLayout(layout, outDir, imagesDir) {
  const orientations = orientationsOf(layout);
  if (orientations.length === 0) throw new Error(`layout ${layout.screen}: no reference size`);
  const written = [];
  for (const o of orientations) {
    const file = join(outDir, orientations.length === 1 ? 'layout.pptx' : `layout-${o}.pptx`);
    writeFileSync(file, await deckBytes(layout, o, imagesDir));
    written.push(file);
  }
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const at = args.indexOf('--images');
  const imagesDir = at >= 0 ? args.splice(at, 2)[1] : undefined;
  if (at >= 0 && (!imagesDir || !existsSync(imagesDir))) throw new Error('--images needs a folder of .png pictures');
  const [srcArg, outArg] = args;
  const src = srcArg || DEFAULT_LAYOUT;
  const outDir = outArg || '.';
  const layout = JSON.parse(readFileSync(src, 'utf8'));
  for (const f of await exportLayout(layout, outDir, imagesDir)) console.log(f);
}
