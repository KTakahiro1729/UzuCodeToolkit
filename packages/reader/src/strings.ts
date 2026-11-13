/**
 * The UI strings, by key. The defaults are strings.json; a work changes any of them with
 * startFlow's `strings` (before the first screen is mounted), so no wording is out of its reach.
 */

import defaults from './strings.json';

export type StringKey = keyof typeof defaults;

const STRINGS: Record<StringKey, string> = { ...defaults };

/** Replace some of the strings. Call before mounting; the screens read them as they render. */
export function overrideStrings(strings: Partial<Record<StringKey, string>>): void {
  for (const [key, text] of Object.entries(strings)) {
    if (!(key in STRINGS)) throw new Error(`unknown UI string: ${key}`);
    if (typeof text === 'string') STRINGS[key as StringKey] = text;
  }
}

export default STRINGS;
