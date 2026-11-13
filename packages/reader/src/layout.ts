/**
 * A screen's layout definition: the one source for where its parts sit, which image each part
 * takes, and which parts each scene shows (docs/design/layout.md). The screen reads it; the tools
 * in tools/layout/ write slides and image briefs from it and read edited slides back into it.
 *
 * A layout is plain JSON so tools and people can read it without building anything. Every number
 * is in px of the reference screen of its orientation. An orientation a layout leaves out is one
 * the work does not support (landscape alone unless the spec asks for portrait).
 */

export type Orientation = 'landscape' | 'portrait';
export type Align = 'left' | 'center' | 'right';
export const ALIGNS: readonly Align[] = ['left', 'center', 'right'];
/** x, y, width, height from the screen's top left. */
export type Rect = readonly [x: number, y: number, width: number, height: number];

export interface LayoutPart {
  /** What the part is, for people: the box's caption on the slides and in the image brief. */
  label: string;
  /**
   * The image drawn in the box: `assets/<image>.webp`. Parts with the same name share one image.
   * `{role}` stands for the role shown there (a character's picture). None: the screen draws it.
   */
  image?: string;
  /** The image stretches to the box's width, keeping its ends (a nameplate). Else it is drawn at the box's size. */
  stretch?: boolean;
  /** How the part's text lines up across its box. None: left. */
  align?: Align;
  landscape?: Rect;
  portrait?: Rect;
}

export interface LayoutArea {
  label: string;
  landscape?: Rect;
  portrait?: Rect;
}

export interface LayoutScene {
  /** The guide's screen number. */
  id: number;
  /** A short slug (file names, slide notes). */
  key: string;
  label: string;
  /** The parts this scene shows, back to front. */
  show: string[];
  /** The parts that take your colour in this scene. */
  mine: string[];
}

export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ScreenLayout {
  screen: string;
  /** Where the numbers come from, when they are a published guide's. */
  source?: string;
  /** Reference screen size per orientation, [width, height]. */
  reference: Partial<Record<Orientation, readonly [number, number]>>;
  parts: Record<string, LayoutPart>;
  /** What UZU draws over the screen: nothing of ours goes there. */
  reserved?: Record<string, LayoutArea>;
  /** Edges that stay empty. */
  margin?: Partial<Record<Orientation, Margin>>;
  scenes: LayoutScene[];
}

export const ORIENTATIONS: readonly Orientation[] = ['landscape', 'portrait'];

/** The orientations a layout supports, in a fixed order. */
export function orientationsOf(layout: ScreenLayout): Orientation[] {
  return ORIENTATIONS.filter((o) => layout.reference[o]);
}

/** How a part's text lines up: its `align`, else left. */
export function alignOf(layout: ScreenLayout, part: string): Align {
  return layout.parts[part]?.align ?? 'left';
}

/** A part's box in one orientation. Throws when the layout lacks it. */
export function rectOf(layout: ScreenLayout, part: string, o: Orientation): Rect {
  const r = layout.parts[part]?.[o];
  if (!r) throw new Error(`layout ${layout.screen}: no ${o} box for part "${part}"`);
  return r;
}

/** What is wrong with a layout, one message each; empty when it is sound. */
export function layoutProblems(layout: ScreenLayout): string[] {
  const problems: string[] = [];
  const orientations = orientationsOf(layout);
  if (orientations.length === 0) problems.push('no reference size for any orientation');
  const isRect = (r: unknown): boolean => Array.isArray(r) && r.length === 4 && r.every((n) => typeof n === 'number' && Number.isFinite(n));
  for (const [id, part] of Object.entries(layout.parts)) {
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(id)) problems.push(`part id "${id}" is not letters and digits`);
    if (part.image !== undefined && !/^[A-Za-z0-9_.{}-]+$/.test(part.image)) problems.push(`part "${id}": image "${part.image}" is not a plain file name`);
    if (part.align !== undefined && !ALIGNS.includes(part.align)) problems.push(`part "${id}": align "${part.align}" is not left, center or right`);
    for (const o of orientations) {
      if (!isRect(part[o])) problems.push(`part "${id}": no ${o} box`);
      else if (part[o]![2] <= 0 || part[o]![3] <= 0) problems.push(`part "${id}": empty ${o} box`);
    }
  }
  const keys = new Set<string>();
  for (const scene of layout.scenes) {
    if (keys.has(scene.key)) problems.push(`scene key "${scene.key}" twice`);
    keys.add(scene.key);
    for (const id of [...scene.show, ...scene.mine]) {
      if (!layout.parts[id]) problems.push(`scene "${scene.key}": unknown part "${id}"`);
    }
    for (const id of scene.mine) {
      if (!scene.show.includes(id)) problems.push(`scene "${scene.key}": part "${id}" takes your colour but is not shown`);
    }
  }
  return problems;
}
