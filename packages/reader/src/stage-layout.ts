/**
 * The stage layout of the read-through: UZU's design guide, "読み合わせ画面"
 * (https://docs.code.uzu-app.com/guides/design/reading). Standing characters, one dialogue
 * frame that shows the line being read, two nameplates and, over everything, the log panel.
 *
 * The numbers are in layouts/read-through.layout.json (docs/design/layout.md), the guide's, in px
 * of its reference screen (874×402 landscape, 402×874 portrait), and nowhere else; this file
 * shapes them for the screen. A scene (which parts show, how wide the nameplates are, who gets the
 * colour) is derived from the line being read by stageScene().
 */

import { type DialogueLine, readerOf, speakersOf } from '@uzu-toolkit/kit';
import { type Orientation, type Rect, rectOf, type ScreenLayout } from './layout';
import readThrough from './layouts/read-through.layout.json';

export type { Orientation, Rect } from './layout';

/** The read-through's layout definition as the toolkit ships it: the guide's. */
export const READ_THROUGH_LAYOUT = readThrough as unknown as ScreenLayout;

export interface StageLayout {
  /** The scene's place, time or chapter. */
  tag: Rect;
  /** Character ①, speaking now. */
  c1: Rect;
  /** Character ②, speaking next (behind ①). */
  c2: Rect;
  /** A character's first appearance: one picture on its own. */
  solo: Rect;
  frame: Rect;
  /** The line: 2 lines landscape, 3 portrait, 18px on 28px. */
  text: Rect;
  /** Both nameplates side by side, ① first: from nameplate ①'s left to the line's right edge. */
  names: Rect;
  /** Width of nameplate ② when it holds just the next mark and name. */
  nextTagWidth: number;
  log: Rect;
  next: Rect;
  panel: Rect;
  /** What UZU draws: the logo, the system indicator and the toast. Nothing of ours goes there. */
  reserved: { logo: Rect; system: Rect; toast: Rect };
  /** Edges that stay empty. */
  margin: { top: number; right: number; bottom: number; left: number };
}

const NO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

/** The screen's view of a layout definition in one orientation. */
export function stageLayoutOf(layout: ScreenLayout, o: Orientation): StageLayout {
  const r = (part: string): Rect => rectOf(layout, part, o);
  const area = (id: string): Rect => layout.reserved?.[id]?.[o] ?? [0, 0, 0, 0];
  const [x, y, , h] = r('plate1');
  const [tx, , tw] = r('text');
  return {
    tag: r('tag'),
    c1: r('c1'),
    c2: r('c2'),
    solo: r('solo'),
    frame: r('frame'),
    text: r('text'),
    names: [x, y, tx + tw - x, h],
    nextTagWidth: r('plate2')[2],
    log: r('log'),
    next: r('next'),
    panel: r('panel'),
    reserved: { logo: area('logo'), system: area('system'), toast: area('toast') },
    margin: layout.margin?.[o] ?? NO_MARGIN,
  };
}

const sizeOf = (o: Orientation) => {
  const [width, height] = READ_THROUGH_LAYOUT.reference[o]!;
  return { width, height };
};

export const REFERENCE = { landscape: sizeOf('landscape'), portrait: sizeOf('portrait') } as const;

export const LAYOUT: Record<Orientation, StageLayout> = {
  landscape: stageLayoutOf(READ_THROUGH_LAYOUT, 'landscape'),
  portrait: stageLayoutOf(READ_THROUGH_LAYOUT, 'portrait'),
};

const plate1 = rectOf(READ_THROUGH_LAYOUT, 'plate1', 'landscape');
const plate2 = rectOf(READ_THROUGH_LAYOUT, 'plate2', 'landscape');

/**
 * Nameplate ①'s least width by what it holds. A name alone has none: the plate fits its name (the
 * guide says its width follows the name's length, 78 in its template) and ② follows NAME_GAP after
 * it and takes the rest of the row. The guide's x187 (landscape) and x135 (portrait) for ② in that
 * case do not agree with 78 (84 + 78 + 10 = 172), so only the two fixed widths are kept as numbers:
 * nameplate ① on your turn (`plate1`) and on the narration (`plateNarration`).
 */
export const NAME_WIDTH = {
  full: plate1[2],
  narration: rectOf(READ_THROUGH_LAYOUT, 'plateNarration', 'landscape')[2],
} as const;
/** The space between the two nameplates. */
export const NAME_GAP = plate2[0] - plate1[0] - plate1[2];

/** CSS for a part's place, in `--u` (a reference px in screen px, set on the stage). */
export function place([x, y, w, h]: Rect): string {
  return `left:calc(${x} * var(--u));top:calc(${y} * var(--u));width:calc(${w} * var(--u));height:calc(${h} * var(--u))`;
}

export interface StageScene {
  /**
   * The guide's screen number: 1 you speak, 2 another speaks, 3 a character's first appearance,
   * 4 you read the narration, 5 another reads it. (6, the log, is opened over any of them.)
   */
  id: 1 | 2 | 3 | 4 | 5;
  /** The line is yours to read: the frame and nameplate ① take your colour and the next button shows. */
  mine: boolean;
  direction: boolean;
  /** The role standing at ① (or alone when `chars` is 'solo'); null for narration. */
  speaker: string | null;
  /** What stands on the stage: none, ① alone, ① and ②, or the first appearance's one picture. */
  chars: 'none' | 'one' | 'pair' | 'solo';
  /** The role at ②, when `chars` is 'pair'. */
  second: string | null;
  /** The line after this one, which nameplate ② speaks of; null on the last line or when it is the same speaker. */
  next: { index: number; role: string; mine: boolean; direction: boolean } | null;
  /** Nameplate ②: the next mark and the next reader's name, or (when you are not reading) the next line itself. */
  plate2: 'tag' | 'preview' | null;
}

/** Which screen of the guide a line is, and what it shows. `roles` are the ones you read. */
export function stageScene(
  lines: readonly DialogueLine[],
  index: number,
  roles: readonly string[],
  isDirection: (line: DialogueLine) => boolean,
): StageScene {
  const line = lines[index];
  const role = readerOf(line);
  const mine = roles.includes(role);
  const direction = isDirection(line);
  const following = lines[index + 1];
  const nextRole = following ? readerOf(following) : null;
  const nextDirection = !!following && isDirection(following);
  const next =
    following && nextRole !== null && (direction || nextDirection || nextRole !== role)
      ? { index: index + 1, role: nextRole, mine: roles.includes(nextRole), direction: nextDirection }
      : null;
  const appeared = lines.slice(0, index).some((l) => !isDirection(l) && speakersOf(l).includes(role));
  const first = !direction && !appeared;
  const second = !direction && !first && next && !next.direction ? next.role : null;
  return {
    id: direction ? (mine ? 4 : 5) : first ? 3 : mine ? 1 : 2,
    mine,
    direction,
    speaker: direction ? null : role,
    chars: direction ? 'none' : first ? 'solo' : second ? 'pair' : 'one',
    second,
    next,
    plate2: next ? (mine ? 'tag' : 'preview') : null,
  };
}
