import { describe, expect, it } from 'vitest';
import { fitsButton, MAX_BUTTON_TEXT, textWidth } from '../src/fit';
import defaults from '../src/strings.json';

/**
 * The label and the note of a main button are one line each. The button has a fixed width (9.6em
 * of the footer text; about 8 full-width characters on a 390px phone), so a longer one wraps and
 * the footer grows. Every `status.*` string is a note; the main buttons' labels are `button.*`
 * except the secondary ones listed here.
 */
const SECONDARY = new Set(['button.back']);

describe('button text', () => {
  for (const [key, text] of Object.entries(defaults)) {
    const note = key.startsWith('status.');
    const label = key.startsWith('button.') && !SECONDARY.has(key);
    if ((!note && !label) || text === '') continue;
    it(`${key} fits one line of the main button (${MAX_BUTTON_TEXT} characters)`, () => {
      expect(textWidth(text), `${key}: ${text}`).toBeLessThanOrEqual(MAX_BUTTON_TEXT);
      expect(fitsButton(text)).toBe(true);
    });
  }
});
