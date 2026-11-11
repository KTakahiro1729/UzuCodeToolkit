/**
 * 作品のデータ。 台本と登場人物はここだけに書く。
 * 役 ID は manifest.json の characters[].id と揃える。
 */

import type { DialogueScene } from '@uzu-toolkit/kit/dialogue';

/** プレイヤーが演じる役。 並びは manifest.json の characters と同じにする。 */
export const ROLE_IDS = ['hina', 'ren'] as const;

/** 話者の表示名 (役と NPC)。 */
export const SPEAKER_NAMES: Record<string, string> = {
  hina: '雛',
  ren: '蓮',
  butler: '執事',
};

export const OPENING: DialogueScene = {
  id: 'opening',
  narratorRoleId: 'hina',
  npcReaderRoleId: 'ren',
  lines: [
    { text: '嵐の夜。 山あいの洋館に、 二人の客が招かれた。' },
    { speaker: 'butler', text: 'ようこそお越しくださいました。 旦那様は書斎でお待ちです。' },
    { speaker: 'hina', text: '叔父様が急に呼び出すなんて、 珍しいわね。' },
    { speaker: 'ren', text: '電話の声、 少し震えてなかったか？' },
    { text: 'そのとき、 書斎の方から鈍い音が響いた。' },
    { speaker: 'hina', text: '……今の音、 何？' },
  ],
};
