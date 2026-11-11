/**
 * 読み合わせ (台本を全員で声に出して読む時間) のデータの形。
 *
 * 台本はデータ、進み具合は共有 state に置く。 どちらも素の JSON で、
 * SDK の state にそのまま載せられる。
 */

/** 台本の 1 行。 `speaker` が無ければ地の文 (ナレーション)。 */
export interface DialogueLine {
  /** 話者の ID。 役 (プレイヤーが演じる) の ID か、 NPC の ID。 */
  speaker?: string;
  text: string;
}

/** 読み合わせの 1 場面。 */
export interface DialogueScene {
  id: string;
  /** 地の文を読む役。 */
  narratorRoleId: string;
  /** NPC の台詞を読む役。 無ければ地の文の担当が読む。 */
  npcReaderRoleId?: string;
  lines: DialogueLine[];
}

/** 共有 state に置く進み具合。 */
export interface DialogueProgress {
  sceneId: string;
  /** いま読んでいる行。 */
  index: number;
  /** 最後の行を送り終えたら true。 */
  finished: boolean;
  /** 読み飛ばしに同意した席 ID。 */
  skipAgreed: string[];
}

/**
 * 画面のタップが何を意味するか。
 * - `reveal`: 文字送りの途中なので全文を出す (誰でも。 端末ローカル)
 * - `advance`: 次の行へ送る (担当だけ。 サーバーへ送る)
 * - `wait`: 担当ではないので何もしない (画面は担当の名前を出しておく)
 * - `done`: 読み終えている
 */
export type TapIntent = 'reveal' | 'advance' | 'wait' | 'done';
