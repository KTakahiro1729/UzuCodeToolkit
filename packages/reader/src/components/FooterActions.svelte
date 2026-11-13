<!--
  Puts a screen's actions into the footer, the one place for main actions on every screen: the
  content stays in the screen's own markup and styles and is moved into the footer's cell.
  It fades out and in with the screen (./motion.ts); the old and new actions share the cell.
  `main` is the main button, the last one the button to press now; two or more buttons there are fused into one capsule;
  `aside` holds the items to its left (`Slot`: more time, the next phase, the time left). Why a
  button cannot be pressed, or what it waits for, is its `note`, not a line of its own.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import { footerSlots } from '../store.svelte';
  import { sceneIn, sceneOut } from './motion';

  let { place = 'main', children }: { place?: 'main' | 'aside'; children: Snippet } = $props();

  // Svelte removes a block's nodes where it put them, so a node moved to the footer would outlive
  // the screen that made it (the old screen's actions stayed after a phase change). Remove it
  // ourselves once the screen is gone, after its fade-out.
  function portal(node: HTMLElement) {
    const move = () => {
      footerSlots[place]?.append(node);
      // The last button of the main row is the one to press now; a danger button goes before it.
      if (import.meta.env?.DEV && place === 'main' && node.lastElementChild?.getAttribute('data-variant') === 'danger') {
        console.warn('A danger button is last in the footer; the last one is the button to press now.');
      }
    };
    if (footerSlots[place]) move();
    else tick().then(move);
    return { destroy: () => node.remove() };
  }
</script>

<div class="actions" data-uzu-actions={place} use:portal in:sceneIn|global out:sceneOut|global>{@render children()}</div>

<style>
  /*
   * The main row: bigger buttons than elsewhere, and the last one (the one to press now) takes
   * the room the others leave. Wraps on a narrow screen, the main button keeping its own row.
   */
  .actions {
    --button-pad-y: 0.62em;
    --button-pad-x: 0.55em;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 0.6em;
    font-family: var(--font-ui);
    font-size: 1.15em;
  }
  .actions > :global(button) {
    /* Room for a label and a note, so the footer never changes height; also 9mm or more to tap at the screen's edge. */
    min-height: 3.5em;
  }
  /* The main button has one width in every state and phase, so it stays where the thumb expects it. */
  .actions > :global(button:last-child) {
    /* Fixed, and gives way only when the items beside it leave too little room. */
    flex: 0 1 9.6em;
    min-width: 7.2em;
  }
  /*
   * Two or more buttons that could each be the main one are fused into a single capsule: the
   * outer ends round, the joints square with a thin seam of the background between them.
   */
  .actions[data-uzu-actions='main'] > :global(button:not(:only-child)) {
    border-radius: 0;
  }
  .actions[data-uzu-actions='main'] > :global(button:not(:only-child):first-child) {
    border-top-left-radius: 999px;
    border-bottom-left-radius: 999px;
  }
  .actions[data-uzu-actions='main'] > :global(button:not(:only-child):last-child) {
    border-top-right-radius: 999px;
    border-bottom-right-radius: 999px;
  }
  .actions[data-uzu-actions='main']:has(> :global(button + button)) {
    gap: 2px;
  }
  /* The items beside the main button keep to one row. */
  .actions[data-uzu-actions='aside'] {
    flex-wrap: nowrap;
    justify-content: flex-start;
    gap: 0.2em;
  }
  /* A line of text alone in the row (such as the watching mark) stays centred. */
  .actions > :global(p) {
    flex: 1;
    margin: 0;
    text-align: center;
  }
</style>
