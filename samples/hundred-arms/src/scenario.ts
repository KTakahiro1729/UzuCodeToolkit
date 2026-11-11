/**
 * 台本 (script/script.json、 CC BY 4.0) を読み込む。 このファイルを含むコードは MIT。
 */

import script from '../script/script.json';

export const TITLE: string = script.title;
export const END_MARK: string = script.end;
export const LINES = script.lines;
/** 役 ID。 並びは manifest.json の characters と同じ。 */
export const ROLE_IDS: string[] = script.cast.map((c) => c.id);
/** 話者の表示名 (台本の表記 勇 / 百)。 */
export const SPEAKER_NAMES: Record<string, string> = Object.fromEntries(
  script.cast.map((c) => [c.id, c.label]),
);
