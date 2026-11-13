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
