/**
 * The stage layout of the read-through: UZU's design guide, "読み合わせ画面"
 * (https://docs.code.uzu-app.com/guides/design/reading). Standing characters, one dialogue
 * frame that shows the line being read, two nameplates and, over everything, the log panel.
 *
 * Every number below is the guide's, in px of its reference screen (874×402 landscape, 402×874
 * portrait). The guide says its values may change; they live here and nowhere else. A scene
 * (which parts show, how wide the nameplates are, who gets the colour) is derived from the line
 * being read by stageScene().
 */

import { type DialogueLine, readerOf, speakersOf } from '@uzu-toolkit/kit';

export type Orientation = 'landscape' | 'portrait';
/** x, y, width, height from the screen's top left. */
export type Rect = readonly [x: number, y: number, width: number, height: number];

export const REFERENCE = {
  landscape: { width: 874, height: 402 },
  portrait: { width: 402, height: 874 },
} as const;

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
  /** Both nameplates side by side, ① first. */
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

export const LAYOUT: Record<Orientation, StageLayout> = {
  landscape: {
    tag: [120, 18, 150, 24],
    c1: [97, 56, 163, 346],
    c2: [297, 69, 163, 333],
    solo: [262, 16, 350, 386],
    frame: [68, 233, 738, 140],
    text: [84, 257, 706, 56],
    names: [84, 217, 706, 32],
    nextTagWidth: 190,
    log: [84, 321, 120, 44],
    next: [670, 321, 120, 44],
    panel: [68, 56, 738, 317],
    reserved: { logo: [68, 8, 44, 44], system: [762, 8, 44, 44], toast: [68, 56, 260, 36] },
    margin: { top: 0, right: 62, bottom: 21, left: 62 },
  },
  portrait: {
    tag: [68, 72, 150, 24],
    c1: [16, 156, 256, 718],
    c2: [250, 184, 136, 690],
    solo: [16, 120, 370, 754],
    frame: [16, 608, 370, 224],
    text: [32, 632, 338, 84],
    names: [32, 592, 338, 32],
    nextTagWidth: 138,
    log: [32, 780, 120, 44],
    next: [250, 780, 120, 44],
    panel: [16, 150, 370, 682],
    reserved: { logo: [16, 62, 44, 44], system: [342, 62, 44, 44], toast: [16, 110, 260, 36] },
    margin: { top: 62, right: 0, bottom: 34, left: 0 },
  },
};

/**
 * Nameplate ①'s width by what it holds, the same in both orientations. The short one (a name
 * alone) is what is left of the guide's nameplate ② position (x187 landscape, x135 portrait)
 * after the 10px gap; the guide's own text gives another value for it, 78, which does not match
 * those positions. A longer name makes the plate grow and ② gives way.
 */
export const NAME_WIDTH = { full: 190, short: 93, narration: 116 } as const;
/** The space between the two nameplates. */
export const NAME_GAP = 10;

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
