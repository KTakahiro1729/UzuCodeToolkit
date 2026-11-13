/**
 * Client entry. startFlow() runs a work as its list of phases; startReader() runs a work that is
 * one read-through (the samples). Passing the logic to run() starts state sync and voice chat.
 */

import type { FlowState, Handout } from '@uzu-toolkit/kit';
import { firstFrameReady, gameEnded, gameReady, getInsets, onInsetsChange, run, type GameLogic, type UzuInsets } from '@uzuhq/code-sdk';
import { mount } from 'svelte';
import './theme.css';
import FlowApp from './components/FlowApp.svelte';
import CastView from './components/CastView.svelte';
import HandoutSheet from './components/HandoutSheet.svelte';
import HandoutView from './components/HandoutView.svelte';
import ReadThroughView from './components/ReadThroughView.svelte';
import type { FlowOptions, PhaseView } from './flow';
import { READING } from './logic';
import { type Script, scenario } from './script';
import { bindSend, game } from './store.svelte';
// UI strings by key.
import STRINGS, { overrideStrings } from './strings';

export type { FlowOptions, PhaseView, PhaseViewProps, ShellProps } from './flow';
export type { StringKey } from './strings';
export type { GameView } from './games';
export type { Script } from './script';
export { default as Button } from './components/Button.svelte';
export { default as TimeLeft } from './components/TimeLeft.svelte';
export { default as Vote } from './components/Vote.svelte';
export { default as Guide } from './components/Guide.svelte';
export { default as CastView } from './components/CastView.svelte';
export { default as EmptyView } from './components/EmptyView.svelte';
export { default as HandoutView } from './components/HandoutView.svelte';
export { default as HandoutReviewView } from './components/HandoutReviewView.svelte';
export { default as GameSelectView } from './components/GameSelectView.svelte';
export { default as ReadThroughView } from './components/ReadThroughView.svelte';
export { STRINGS };

// What a work's own shell (FlowOptions.shell) is built from: the state, the sender, the band's
// label, the footer's cells, and the parts the default shell is made of.
export { band, footerSlots, game, sendAction } from './store.svelte';
export { sceneIn, sceneOut } from './components/motion';
export { default as FlowApp } from './components/FlowApp.svelte';
export { default as Frame } from './components/Frame.svelte';
export { default as TopBand } from './components/TopBand.svelte';
export { default as FooterActions } from './components/FooterActions.svelte';
export { default as Slot } from './components/Slot.svelte';
export { default as PhaseList } from './components/PhaseList.svelte';
export { provideFlow, type FlowInfo } from './flowContext';
export { default as Sheet } from './components/Sheet.svelte';

/** PhaseView.reopen for a handout phase: after time ran out, the next screen offers more time. */
export const handoutReopen = {
  get label() {
    return STRINGS['handout.extend'];
  },
  when: (s: { timeUp: boolean }) => s.timeUp,
};

/** PhaseView.done for a ready phase (CastView): the seats that are ready. */
export const readyDone = (s: { ready: string[] }): string[] => s.ready;

/** PhaseView.done for a handout phase. Who is done is not shown while reading (owner's decision), so none. */
export const handoutDone = (): string[] => [];

/** PhaseView.keep for a handout phase: from the footer, the handouts can be read again. */
export const handoutKeep = {
  get label() {
    return STRINGS['footer.handout'];
  },
  view: HandoutSheet,
};

/**
 * A handout phase's whole screen side (view, content and the wiring the shell reads): spread it
 * into the phase, `{ id, label, ...handoutScreen(handouts) }`, so a new handout feature never asks
 * the work for more wiring. `props` joins the screen's props (`guide`, ...).
 */
export const handoutScreen = (handout: Handout, props: Record<string, unknown> = {}): Omit<PhaseView, 'id' | 'label'> => ({
  view: HandoutView,
  props: { ...props, handout },
  reopen: handoutReopen,
  keep: handoutKeep,
  done: handoutDone,
});

/** The same for an introduction that waits for everyone (readyPhase): CastView with the ready checks. */
export const castScreen = (props: Record<string, unknown>): Omit<PhaseView, 'id' | 'label'> => ({
  view: CastView,
  props,
  done: readyDone,
});

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
  const shared = hud.x <= width * SHARED_ROW_MAX;
  s.setProperty('--band-top', `${shared ? 0 : hud.y}px`);
  // The band's CSS tells the two layouts apart by this (TopBand).
  document.documentElement.dataset.bandRow = shared ? 'shared' : 'own';
}

/**
 * Mount a work's phases and connect them to the SDK. `logic` is the work's flowLogic() (the
 * manifest's serverActionLogicPath); `phases` gives each of its phases, in the same order, a band
 * label and a screen. The game ends when the last phase is done. `strings` replaces any of the UI
 * strings; `shell` replaces the frame around the phases (the band, the footer, the sheets): see
 * ShellProps.
 */
export function startFlow(logic: GameLogic<FlowState>, { parts, phases, orientation, shell = FlowApp, strings }: FlowOptions): void {
  if (strings) overrideStrings(strings);
  applyInsets(getInsets());
  onInsetsChange(applyInsets);
  addEventListener('resize', () => applyInsets(getInsets()));

  mount(shell, { target: document.body, props: { parts, phases } });
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
export { default as TransitionFooter } from './components/TransitionFooter.svelte';
export { fitsButton, MAX_BUTTON_TEXT, textWidth } from './fit';
