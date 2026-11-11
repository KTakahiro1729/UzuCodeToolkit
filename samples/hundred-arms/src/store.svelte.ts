/** SDK から届いた共有 state と送信口を画面へ渡す。 */

import type { State } from './logic';

export const game = $state<{ state: State | null; me: string | null }>({ state: null, me: null });

let send: (type: string, payload: Record<string, unknown>) => void = () => {};

export function bindSend(fn: typeof send): void {
  send = fn;
}

export function sendAction(type: string, payload: Record<string, unknown>): void {
  send(type, payload);
}
