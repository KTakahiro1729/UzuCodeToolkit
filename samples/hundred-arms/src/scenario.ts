/**
 * 台本 (script/script.json) を読み合わせの部品の形へ組み直す。
 * 台本の文章は CC BY 4.0 (script/LICENSE.md)、 このファイルを含むコードは MIT。
 */

import type { DialogueScene } from '@uzu-toolkit/kit/dialogue';
import script from '../script/script.json';

export const TITLE: string = script.title;
/** 最後の行を読み終えたあとに出す結び。 */
export const END_MARK: string = script.end;

/** プレイヤーが演じる役。 並びは manifest.json の characters と同じにする。 */
export const ROLE_IDS: readonly string[] = script.cast.map((c) => c.id);

/** 話者の表示名。 台本の表記 (勇 / 百) をそのまま使う。 */
export const SPEAKER_NAMES: Record<string, string> = Object.fromEntries(
  script.cast.map((c) => [c.id, c.label]),
);

export const OPENING: DialogueScene = {
  id: 'main',
  // この台本に地の文は無いが、 部品が担当を要るので勇者に置く。
  narratorRoleId: 'yu',
  lines: script.lines,
};
