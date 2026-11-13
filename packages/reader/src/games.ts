/** A game on the game-select screen: its logic entry plus what the screen shows. */

import type { GameEntry } from '@uzu-toolkit/kit';
import type { Component } from 'svelte';

export interface GameView extends GameEntry {
  /** The game's name on the list and in the band while it is played: the text itself. */
  label: string;
  /** Gets PhaseViewProps; its state is the game's, and send() names the game's own actions. */
  view: Component<any>;
}
