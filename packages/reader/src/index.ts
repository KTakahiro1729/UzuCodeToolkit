/**
 * Client entry shared by the samples. Passing the logic to run() starts state sync and voice chat.
 */

import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type GameLogic, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import './theme.css';
import App from './components/App.svelte';
import type { State } from './logic';
import { type Script, scenario } from './script';
import { bindSend, game, setScenario } from './store.svelte';

export type { Script } from './script';

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

/** Mount the read-through for a script and connect it to the SDK. */
export function startReader(script: Script, logic: GameLogic<State>, orientation: 'portrait' | 'landscape'): void {
  const s = scenario(script);
  setScenario(s);
  applyInsets(getInsets());
  onInsetsChange(applyInsets);
  addEventListener('resize', () => applyInsets(getInsets()));

  mount(App, { target: document.body });
  // The host keeps its splash screen up until firstFrameReady().
  requestAnimationFrame(() => firstFrameReady());

  let ready = false;
  run({
    logic,
    playerCount: s.parts.length,
    orientation,
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
}
