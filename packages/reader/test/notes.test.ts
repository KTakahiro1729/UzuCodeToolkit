import { describe, expect, it } from 'vitest';
import defaults from '../src/strings.json';

/**
 * The note under a button's label is one line. The main button has a fixed width (7.4em of the
 * footer text; about 7 full-width characters of the note on a 390px phone), so a longer note wraps
 * and the footer grows. Every `status.*` string is a note.
 */
const MAX_WIDTH = 7;
/** Width in full-width characters: half-width letters and digits count half; `{name}` stands for a 4-character name, `{n}` for one digit. */
const widthOf = (text: string): number =>
  [...text.replace(/\{name\}/g, '全角四文字').replace(/\{n\}/g, '1')].reduce((w, ch) => w + (/[\x20-\x7e]/.test(ch) ? 0.5 : 1), 0);

describe('button notes', () => {
  for (const [key, text] of Object.entries(defaults)) {
    if (!key.startsWith('status.') || text === '') continue;
    it(`${key} fits one line of the main button (${MAX_WIDTH} characters)`, () => {
      expect(widthOf(text), `${key}: ${text}`).toBeLessThanOrEqual(MAX_WIDTH);
    });
  }
});
