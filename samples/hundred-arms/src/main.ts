/**
 * クライアントの入口。 run() にロジックを渡すと、 状態同期とボイスチャットが動き出す。
 */

import {
  firstFrameReady,
  gameEnded,
  gameReady,
  getInsets,
  onInsetsChange,
  run,
  type UzuInsets,
} from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import App from './components/App.svelte';
import logic from './logic';
import { ROLE_IDS } from './scenario';
import { bindSend, game } from './store.svelte';

/**
 * Safe Area と UZU の HUD (左上のボタン群) を CSS 変数に流す。
 * 画面は --safe-* で端を避け、 見出しは --hud-x / --hud-y で HUD の右へ逃がす。
 */
function applyInsets(insets: UzuInsets): void {
  const root = document.documentElement.style;
  const { safeArea, hud } = insets;
  root.setProperty('--safe-top', `${safeArea.top}px`);
  root.setProperty('--safe-right', `${safeArea.right}px`);
  root.setProperty('--safe-bottom', `${safeArea.bottom}px`);
  root.setProperty('--safe-left', `${safeArea.left}px`);
  root.setProperty('--hud-x', `${hud.x}px`);
  root.setProperty('--hud-y', `${hud.y}px`);
}
applyInsets(getInsets());
onInsetsChange(applyInsets);

mount(App, { target: document.body });

// ホストは firstFrameReady() を受けるまでスプラッシュで画面を隠す。 最初の描画を待ってから呼ぶ。
requestAnimationFrame(() => firstFrameReady());

let ready = false;

run({
  logic,
  playerCount: ROLE_IDS.length,
  orientation: 'landscape',
  onState(state, myPlayerId, mySeatKind) {
    game.state = state;
    game.me = myPlayerId;
    game.seatKind = mySeatKind;
    // 操作を受け付けられるようになったことを知らせる (認証要件の SHOULD)。
    if (!ready) {
      ready = true;
      gameReady();
    }
    if (state.phase === 'end') gameEnded();
  },
  inputs(sendAction) {
    bindSend((type, payload) => sendAction(type, payload ?? {}));
  },
});
