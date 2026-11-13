import { describe, expect, it } from 'vitest';
import type { ScreenLayout } from '../src/layout';
import { artOf, imageNames, nameWidthsOf, READ_THROUGH_LAYOUT, stageLayoutOf, stageOrientation } from '../src/stage-layout';

const landscapeOnly = (): ScreenLayout => {
  const copy = JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT)) as ScreenLayout;
  delete copy.reference.portrait;
  return copy;
};

describe('image parts of the stage read-through', () => {
  it('lists each image the layout draws once, without the characters', () => {
    expect(imageNames(READ_THROUGH_LAYOUT).sort()).toEqual(['bg', 'button', 'frame', 'panel', 'plate']);
  });

  it('a part is drawn from its image only once the image has loaded', () => {
    expect(artOf(READ_THROUGH_LAYOUT, 'frame', {})).toBeUndefined();
    expect(artOf(READ_THROUGH_LAYOUT, 'frame', { frame: false })).toBeUndefined();
    expect(artOf(READ_THROUGH_LAYOUT, 'frame', { frame: true })).toBe('url("./assets/frame.webp")');
    // The three nameplates share one picture.
    for (const part of ['plate1', 'plateNarration', 'plate2']) expect(artOf(READ_THROUGH_LAYOUT, part, { plate: true })).toBe('url("./assets/plate.webp")');
  });

  it('a part with no image in the layout stays drawn from the colour tokens', () => {
    for (const part of ['tag', 'text', 'log']) expect(artOf(READ_THROUGH_LAYOUT, part, { bg: true, frame: true, plate: true })).toBeUndefined();
  });

  it('follows the screen, or keeps the one orientation a layout has', () => {
    expect(stageOrientation(READ_THROUGH_LAYOUT, true)).toBe('landscape');
    expect(stageOrientation(READ_THROUGH_LAYOUT, false)).toBe('portrait');
    expect(stageOrientation(landscapeOnly(), false)).toBe('landscape');
  });

  it("takes the nameplate widths from the layout's own boxes", () => {
    const widened = JSON.parse(JSON.stringify(READ_THROUGH_LAYOUT)) as ScreenLayout;
    widened.parts.plate1!.landscape = [84, 217, 200, 32];
    expect(nameWidthsOf(widened, 'landscape')).toMatchObject({ full: 200, gap: 0 });
    expect(nameWidthsOf(READ_THROUGH_LAYOUT, 'landscape')).toEqual({ full: 190, narration: 116, gap: 10 });
    expect(stageLayoutOf(landscapeOnly(), 'landscape').frame).toEqual([68, 233, 738, 140]);
  });
});
