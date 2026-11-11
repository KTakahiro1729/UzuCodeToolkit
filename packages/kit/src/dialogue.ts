/**
 * 読み合わせ: 台本を 1 行ずつ、 話者の役のプレイヤーが声に出して読み、 自分で次へ送る。
 *
 * 状態を変える関数は渡された progress を直接書き換える (SDK の action handler は
 * live な state を書き換える形なので、 そのまま呼べる)。 弾くときは Error を投げる。
 */

export interface DialogueLine {
  /** 読む役の ID。 */
  speaker: string;
  text: string;
}

/** 共有 state に置く進み具合。 */
export interface DialogueProgress {
  /** いま読んでいる行。 */
  index: number;
  /** 最後の行を送り終えたら true。 */
  finished: boolean;
}

export function startDialogue(): DialogueProgress {
  return { index: 0, finished: false };
}

/** いまの行。 読み終えていれば null。 */
export function currentLine(lines: readonly DialogueLine[], p: DialogueProgress): DialogueLine | null {
  return p.finished ? null : (lines[p.index] ?? null);
}

/**
 * 次の行へ送る。 送れるのはいまの行の話者だけ。
 * `seenIndex` は押した人が見ていた行で、 遅れて届いた二重タップが 2 行進めるのを防ぐ。
 */
export function advanceDialogue(
  lines: readonly DialogueLine[],
  p: DialogueProgress,
  roleId: string | undefined,
  seenIndex: number,
): void {
  const line = currentLine(lines, p);
  if (!line) throw new Error('読み終えています');
  if (seenIndex !== p.index) throw new Error('もう次の行へ進んでいます');
  if (line.speaker !== roleId) throw new Error('この行を送るのは話者です');
  if (p.index + 1 < lines.length) p.index += 1;
  else p.finished = true;
}
