/** Hands the shared state and the action sender to the view. */

import type { FlowState } from '@uzu-toolkit/kit';

export const game = $state<{ state: FlowState | null; me: string | null }>({ state: null, me: null });

/**
 * A label the current phase's view puts in the band in place of the phase's own, such as the
 * post-game label once the post-game screen comes in. Null for the phase's own label.
 */
export const band = $state<{ label: string | null }>({ label: null });

let send: (type: string, payload: Record<string, unknown>) => void = () => {};

export function bindSend(fn: typeof send): void {
  send = fn;
}

export function sendAction(type: string, payload: Record<string, unknown>): void {
  send(type, payload);
}

/**
 * The footer's two action cells, set by the frame: `main` for the screen's main action (the
 * advance or next button, the handout's clock and buttons), `aside` for a quieter action beside
 * it (going back to the handouts). Screens put their actions there with FooterActions.
 */
export const footerSlots = $state<{ main: HTMLElement | null; aside: HTMLElement | null }>({
  main: null,
  aside: null,
});
