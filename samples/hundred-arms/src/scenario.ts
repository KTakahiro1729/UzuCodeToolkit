/**
 * Loads the script (script/script.json, CC BY 4.0). The code, including this file, is MIT.
 */

import script from '../script/script.json';

export const TITLE: string = script.title;
export const END_MARK: string = script.end;
/** The author's afterword, shown after the end for the post-game talk. */
export const AFTERWORD: string = script.afterword;
export const LINES = script.lines;
/** Role IDs, in the same order as manifest.json characters. */
export const ROLE_IDS: string[] = script.cast.map((c) => c.id);
/** Speaker display names, as written in the script. */
export const SPEAKER_NAMES: Record<string, string> = Object.fromEntries(
  script.cast.map((c) => [c.id, c.label]),
);
