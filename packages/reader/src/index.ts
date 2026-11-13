/**
 * Client entry. startFlow() runs a work as its list of phases; startReader() runs a work that is
 * one read-through (the samples). Passing the logic to run() starts state sync and voice chat.
 */

import type { FlowState } from '@uzu-toolkit/kit';
import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type GameLogic, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import './theme.css';
import FlowApp from './components/FlowApp.svelte';
import HandoutSheet from './components/HandoutSheet.svelte';
import ReadThroughView from './components/ReadThroughView.svelte';
import type { FlowOptions } from './flow';
import { READING } from './logic';
import { type Script, scenario } from './script';
import { bindSend, game } from './store.svelte';
// UI strings by key.
import STRINGS from './strings.json';

export type { FlowOptions, PhaseView, PhaseViewProps } from './flow';
export type { GameView } from './games';
export type { Script } from './script';
export { default as Button } from './components/Button.svelte';
export { default as TimeLeft } from './components/TimeLeft.svelte';
export { default as Vote } from './components/Vote.svelte';
export { default as Guide } from './components/Guide.svelte';
export { default as CastView } from './components/CastView.svelte';
export { default as EmptyView } from './components/EmptyView.svelte';
export { default as HandoutView } from './components/HandoutView.svelte';
export { default as GameSelectView } from './components/GameSelectView.svelte';
export { default as ReadThroughView } from './components/ReadThroughView.svelte';
export { STRINGS };

/** PhaseView.reopen for a handout phase: after time ran out, the next screen offers more time. */
export const handoutReopen = { label: STRINGS['handout.extend'], when: (s: { timeUp: boolean }) => s.timeUp };

/** PhaseView.done for a ready phase (CastView): the seats that are ready. */
export const readyDone = (s: { ready: string[] }): string[] => s.ready;

/** PhaseView.done for a handout phase: the seats that tapped done. */
export const handoutDone = (s: { ready: Record<string, boolean> }): string[] =>
  Object.keys(s.ready).filter((seat) => s.ready[seat]);

/** PhaseView.keep for a handout phase: from the footer, the handouts can be read again. */
export const handoutKeep = { label: STRINGS['footer.handout'], view: HandoutSheet };

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

/**
 * Mount a work's phases and connect them to the SDK. `logic` is the work's flowLogic() (the
 * manifest's serverActionLogicPath); `phases` gives each of its phases, in the same order, a band
 * label and a screen. The game ends when the last phase is done.
 */
export function startFlow(logic: GameLogic<FlowState>, { parts, phases, orientation }: FlowOptions): void {
  applyInsets(getInsets());
  onInsetsChange(applyInsets);
  addEventListener('resize', () => applyInsets(getInsets()));

  mount(FlowApp, { target: document.body, props: { parts, phases } });
  // The host keeps its splash screen up until firstFrameReady().
  requestAnimationFrame(() => firstFrameReady());

  let ready = false;
  run({
    logic,
    playerCount: parts.length,
    orientation,
    onState(state, myPlayerId) {
      game.state = state;
      game.me = myPlayerId;
      if (!ready) {
        ready = true;
        gameReady();
      }
      if (state.ended) gameEnded();
    },
    inputs(sendAction) {
      bindSend(sendAction);
    },
  });
}

/** Mount the read-through of a script as a whole work and connect it to the SDK. */
export function startReader(script: Script, logic: GameLogic<FlowState>, orientation: 'portrait' | 'landscape'): void {
  startFlow(logic, {
    parts: scenario(script).parts,
    phases: [{ id: READING, label: STRINGS['phase.reading'], view: ReadThroughView, props: { script } }],
    orientation,
  });
}
