/**
 * Whether a main button's label and note fit its fixed width on one line each (docs/design.md,
 * Footer). The width holds about 7 full-width characters on a 390px phone. A work's own test
 * can call these on its labels and notes, so a long one fails there and not on the screen.
 */

/** Characters of one line in the main button, in full-width characters. */
export const MAX_BUTTON_TEXT = 7;

/** Width in full-width characters: half-width letters and digits count half; `{name}` stands for a 4-character name, `{n}` for one digit. */
export const textWidth = (text: string): number =>
  [...text.replace(/\{name\}/g, '全角四文字').replace(/\{n\}/g, '1')].reduce((w, ch) => w + (/[\x20-\x7e]/.test(ch) ? 0.5 : 1), 0);

/** True when the label (such as `次のフェーズへ`) and the note, if any, each fit one line of the main button. */
export const fitsButton = (label: string, note?: string): boolean => textWidth(label) <= MAX_BUTTON_TEXT && (note === undefined || textWidth(note) <= MAX_BUTTON_TEXT);
