/**
 * サーバー権威のロジック (manifest.json の serverActionLogicPath)。
 *
 * actions はクライアントの先読みとサーバーの両方で走るので決定的に書く
 * (乱数・実時刻を state に書かない)。 弾く操作は Error を投げると state が巻き戻る。
 */

import {
  advanceDialogue,
  type DialogueProgress,
  startDialogue,
  toggleSkip,
} from '@uzu-toolkit/kit/dialogue';
import { assignRoles } from '@uzu-toolkit/kit/roles';
import type { ActionArgs, GameLogic } from '@uzuhq/code-sdk';
import { OPENING, ROLE_IDS } from './scenario';

export interface State {
  /** 席 ID → 役 ID。 観測者 (進行管理席など) は載らない。 */
  roles: Record<string, string>;
  phase: 'dialogue' | 'end';
  dialogue: DialogueProgress;
}

function playerIds(state: State): string[] {
  return Object.keys(state.roles);
}

/** 読み終えたら次のフェーズへ。 フェーズを増やすときはここを広げる。 */
function exitIfFinished(state: State): void {
  if (state.phase === 'dialogue' && state.dialogue.finished) state.phase = 'end';
}

const logic: GameLogic<State> = {
  setup({ players }) {
    return {
      roles: assignRoles(players, ROLE_IDS),
      phase: 'dialogue',
      dialogue: startDialogue(OPENING),
    };
  },
  actions: {
    /** 行送り。 payload.index は押した人が見ていた行。 */
    advance({ state, playerId, payload }: ActionArgs<State, { index?: number }>) {
      if (state.phase !== 'dialogue') throw new Error('読み合わせの時間ではありません');
      advanceDialogue(OPENING, state.dialogue, state.roles[playerId], ROLE_IDS, payload?.index);
      exitIfFinished(state);
    },
    /** 読み飛ばしへの同意 (押し直すと取り消し)。 */
    skip({ state, playerId }) {
      if (state.phase !== 'dialogue') throw new Error('読み合わせの時間ではありません');
      toggleSkip(state.dialogue, playerId, playerIds(state));
      exitIfFinished(state);
    },
  },
  update() {},
};

export default logic;
