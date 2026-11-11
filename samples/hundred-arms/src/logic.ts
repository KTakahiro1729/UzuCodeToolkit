/**
 * サーバー権威のロジック (manifest.json の serverActionLogicPath)。
 * actions はクライアントの先読みとサーバーの両方で走るので決定的に書く。
 */

import { advanceDialogue, assignRoles, type DialogueProgress, startDialogue } from '@uzu-toolkit/kit';
import type { ActionArgs, GameLogic } from '@uzuhq/code-sdk';
import { LINES, ROLE_IDS } from './scenario';

export interface State {
  /** 席 ID → 役 ID。 */
  roles: Record<string, string>;
  dialogue: DialogueProgress;
}

const logic: GameLogic<State> = {
  setup: ({ players }) => ({ roles: assignRoles(players, ROLE_IDS), dialogue: startDialogue() }),
  actions: {
    advance({ state, playerId, payload }: ActionArgs<State, { index: number }>) {
      advanceDialogue(LINES, state.dialogue, state.roles[playerId], payload.index);
    },
  },
  update() {},
};

export default logic;
