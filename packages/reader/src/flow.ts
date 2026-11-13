/** What a work's client entry hands startFlow(): each phase's label and screen. */

import type { Part } from '@uzu-toolkit/kit';
import type { Component } from 'svelte';

/** The props every phase screen gets, plus the entry's own `props`. */
export interface PhaseViewProps<P = any> {
  /** This phase's state. */
  state: P;
  /** Your seat. */
  me: string;
  /** The part you play. */
  part: string;
  /** Seat ID -> part ID. */
  parts: Record<string, string>;
  /** Part ID -> its display name (manifest characters[].name). */
  names: Record<string, string>;
  /** Send one of this phase's actions (sent as `${phaseId}:${name}`). */
  send(name: string, payload?: Record<string, unknown>): void;
  /** True in the work's last phase. */
  last: boolean;
}

export interface PhaseView {
  /** The phase's ID in the logic; the list is in the logic's order. */
  id: string;
  /** The band's phase label: the text itself (from the work's data or a strings key). */
  label: string;
  view: Component<any>;
  /** Content the screen needs besides the state, such as the script: passed through as props. */
  props?: Record<string, unknown>;
  /**
   * For a phase whose logic has `reopen`: while the next phase has had no action yet and `when`
   * holds for this phase's state, the next screen shows a button with `label` that sends it.
   */
  reopen?: { label: string; when(state: any): boolean };
  /**
   * Content that stays readable once the game has left this phase, such as the handouts: the
   * footer gets a button with `label` that opens `view` over the current screen, with this
   * phase's props.
   */
  keep?: { label: string; view: Component<any> };
}

export interface FlowOptions {
  /** Every part, in the work's order: the band shows them, and their count is the player count. */
  parts: readonly Part[];
  phases: readonly PhaseView[];
  orientation: 'portrait' | 'landscape';
}
