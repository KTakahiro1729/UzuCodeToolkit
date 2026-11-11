/**
 * Client entry. Passing the logic to run() starts state sync and voice chat.
 */

import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import App from './components/App.svelte';
import logic from './logic';
import { ROLE_IDS } from './scenario';
import { bindSend, game } from './store.svelte';

/** Expose the safe area and the UZU HUD (top-left buttons) as CSS variables. */
function applyInsets({ safeArea, hud }: UzuInsets): void {
  const s = document.documentElement.style;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) s.setProperty(`--safe-${side}`, `${safeArea[side]}px`);
  s.setProperty('--hud-x', `${hud.x}px`);
  s.setProperty('--hud-y', `${hud.y}px`);
}
applyInsets(getInsets());
onInsetsChange(applyInsets);

mount(App, { target: document.body });
// The host keeps its splash screen up until firstFrameReady().
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
