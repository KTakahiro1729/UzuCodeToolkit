/**
 * クライアントの入口。 run() にロジックを渡すと、 状態同期とボイスチャットが動き出す。
 */

import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import App from './components/App.svelte';
import logic from './logic';
import { ROLE_IDS } from './scenario';
import { bindSend, game } from './store.svelte';

/** Safe Area と UZU の HUD (左上のボタン群) を CSS 変数に流す。 */
function applyInsets({ safeArea, hud }: UzuInsets): void {
  const s = document.documentElement.style;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) s.setProperty(`--safe-${side}`, `${safeArea[side]}px`);
  s.setProperty('--hud-y', `${hud.y}px`);
}
applyInsets(getInsets());
onInsetsChange(applyInsets);

mount(App, { target: document.body });
// ホストは firstFrameReady() を受けるまでスプラッシュで画面を隠す。
requestAnimationFrame(() => firstFrameReady());

let ready = false;
run({
  logic,
  playerCount: ROLE_IDS.length,
  orientation: 'landscape',
  onState(state, myPlayerId) {
    game.state = state;
    game.me = myPlayerId;
    if (!ready) {
      ready = true;
      gameReady();
    }
    if (state.dialogue.finished) gameEnded();
  },
  inputs(sendAction) {
    bindSend(sendAction);
  },
});
