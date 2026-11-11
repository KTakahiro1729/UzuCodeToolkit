/** Hands the shared state and the action sender from the SDK to the view. */

import type { State } from './logic';

export const game = $state<{ state: State | null; me: string | null }>({ state: null, me: null });

let send: (type: string, payload: Record<string, unknown>) => void = () => {};

export function bindSend(fn: typeof send): void {
  send = fn;
}

export function sendAction(type: string, payload: Record<string, unknown>): void {
  send(type, payload);
}
