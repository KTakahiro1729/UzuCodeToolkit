/**
 * 読み合わせの純関数。 server の action と画面の両方から同じ関数を通し、
 * 「押せる見た目」と「実際に押せること」を一致させる。
 *
 * 状態を変える関数は渡された progress を直接書き換える (SDK の action handler は
 * live な state を書き換える形なので、 そのまま呼べる)。 弾くときは Error を投げる。
 */

import type { DialogueLine, DialogueProgress, DialogueScene, TapIntent } from './types';

/** 読み合わせを始める。 */
export function startDialogue(scene: DialogueScene): DialogueProgress {
  if (scene.lines.length === 0) throw new Error(`場面 ${scene.id} に行がありません`);
  return { sceneId: scene.id, index: 0, finished: false, skipAgreed: [] };
}

/**
 * その行を送る役。 送る人を 1 人に固定するのは、 誰でも押せると最初に押した人だけが
 * 進み、 残りの人のタップが空振りするため。
 *
 * - 役の台詞: その役
 * - NPC の台詞: `npcReaderRoleId`、 無ければ地の文の担当
 * - 地の文: `narratorRoleId`
 */
export function readerRoleOf(
  scene: DialogueScene,
  line: DialogueLine,
  roleIds: readonly string[],
): string {
  if (line.speaker !== undefined && roleIds.includes(line.speaker)) return line.speaker;
  if (line.speaker !== undefined) return scene.npcReaderRoleId ?? scene.narratorRoleId;
  return scene.narratorRoleId;
}

/** いまの行。 読み終えていれば null。 */
export function currentLine(scene: DialogueScene, progress: DialogueProgress): DialogueLine | null {
  if (progress.finished) return null;
  return scene.lines[progress.index] ?? null;
}

/** いまの行を送る役。 読み終えていれば null。 */
export function currentReader(
  scene: DialogueScene,
  progress: DialogueProgress,
  roleIds: readonly string[],
): string | null {
  const line = currentLine(scene, progress);
  return line ? readerRoleOf(scene, line, roleIds) : null;
}

/** 次の行を送る役。 次に読む人が声の準備をできるよう、 画面で先に出す。 */
export function nextReader(
  scene: DialogueScene,
  progress: DialogueProgress,
  roleIds: readonly string[],
): string | null {
  if (progress.finished) return null;
  const line = scene.lines[progress.index + 1];
  return line ? readerRoleOf(scene, line, roleIds) : null;
}

/**
 * 読み返せる行 (いまの行まで)。 先の行は見せない。
 * 読み終えたあとは全行を返すので、 そのまま読み返しの画面に使える。
 */
export function readLines(scene: DialogueScene, progress: DialogueProgress): DialogueLine[] {
  if (progress.finished) return scene.lines.slice();
  return scene.lines.slice(0, progress.index + 1);
}

/** その役がいま送れるか。 画面のボタンの出し分けにも使う。 */
export function canAdvance(
  scene: DialogueScene,
  progress: DialogueProgress,
  roleId: string | null | undefined,
  roleIds: readonly string[],
): boolean {
  if (!roleId) return false;
  return currentReader(scene, progress, roleIds) === roleId;
}

/**
 * 次の行へ送る。 最後の行なら finished にする。
 * 担当でなければ Error を投げる (SDK は state を巻き戻し、 送信元にエラーを返す)。
 *
 * `expectedIndex` を渡すと、 その行を見て押した操作だけを通す。 通信の遅れで
 * 2 回届いたタップが 2 行進めてしまうのを防ぐ。
 */
export function advanceDialogue(
  scene: DialogueScene,
  progress: DialogueProgress,
  roleId: string | null | undefined,
  roleIds: readonly string[],
  expectedIndex?: number,
): void {
  if (progress.sceneId !== scene.id) throw new Error('別の場面の操作です');
  if (progress.finished) throw new Error('この場面は読み終えています');
  if (expectedIndex !== undefined && expectedIndex !== progress.index) {
    throw new Error('もう次の行へ進んでいます');
  }
  if (!canAdvance(scene, progress, roleId, roleIds)) {
    throw new Error('この行を送るのは担当の人です');
  }
  if (progress.index + 1 < scene.lines.length) {
    progress.index += 1;
  } else {
    progress.finished = true;
  }
}

/**
 * 読み飛ばしに同意する (同意済みならもう一度押すと取り消す)。
 * 全員が同意したら finished にし、 true を返す。
 */
export function toggleSkip(
  progress: DialogueProgress,
  playerId: string,
  allPlayerIds: readonly string[],
): boolean {
  if (progress.finished) throw new Error('この場面は読み終えています');
  if (!allPlayerIds.includes(playerId)) throw new Error('プレイヤーではありません');
  const at = progress.skipAgreed.indexOf(playerId);
  if (at >= 0) {
    progress.skipAgreed.splice(at, 1);
    return false;
  }
  progress.skipAgreed.push(playerId);
  if (allPlayerIds.every((id) => progress.skipAgreed.includes(id))) {
    progress.finished = true;
    return true;
  }
  return false;
}

/**
 * 画面のタップの意味。 1 回目は文字送りを全文にし (誰でも)、 全文が出ていれば
 * 担当だけが次へ送る。 文字送りの途中かどうかは端末ごとの状態なので引数でもらう。
 */
export function tapIntent(args: {
  fullyShown: boolean;
  isReader: boolean;
  finished: boolean;
}): TapIntent {
  if (args.finished) return 'done';
  if (!args.fullyShown) return 'reveal';
  return args.isReader ? 'advance' : 'wait';
}
