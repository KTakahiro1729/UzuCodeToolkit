/**
 * Client entry. Passing the logic to run() starts state sync and voice chat.
 */

import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import './theme.css';
import App from './components/App.svelte';
import logic from './logic';
import { ROLE_IDS } from './scenario';
import { bindSend, game } from './store.svelte';

/**
 * The top band shares the HUD's row when the HUD takes at most this share of the width. Upright
 * phones (HUD about a third of the width) give the band its own row so the centred phase label
 * keeps clear of the HUD; wider screens (HUD under a fifth) share it and keep the height.
 */
const SHARED_ROW_MAX = 0.25;

/** Expose the safe area, the UZU HUD (top-left buttons) and where the band starts as CSS variables. */
function applyInsets({ safeArea, hud }: UzuInsets): void {
  const s = document.documentElement.style;
  for (const side of ['top', 'right', 'bottom', 'left'] as const) s.setProperty(`--safe-${side}`, `${safeArea[side]}px`);
  s.setProperty('--hud-x', `${hud.x}px`);
  s.setProperty('--hud-y', `${hud.y}px`);
  const width = innerWidth - safeArea.left - safeArea.right;
  s.setProperty('--band-top', `${hud.x <= width * SHARED_ROW_MAX ? 0 : hud.y}px`);
}
applyInsets(getInsets());
onInsetsChange(applyInsets);
addEventListener('resize', () => applyInsets(getInsets()));

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
