<!--
  Puts a screen's actions into the footer, the one place for main actions on every screen: the
  content stays in the screen's own markup and styles and is moved into the footer's cell.
  It fades out and in with the screen (./motion.ts); the old and new actions share the cell.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { tick } from 'svelte';
  import { footerSlots } from '../store.svelte';
  import { sceneIn, sceneOut } from './motion';

  let { place = 'main', children }: { place?: 'main' | 'aside' | 'status'; children: Snippet } = $props();

  // Svelte removes a block's nodes where it put them, so a node moved to the footer would outlive
  // the screen that made it (the old screen's actions stayed after a phase change). Remove it
  // ourselves once the screen is gone, after its fade-out.
  function portal(node: HTMLElement) {
    const move = () => footerSlots[place]?.append(node);
    if (footerSlots[place]) move();
    else tick().then(move);
    return { destroy: () => node.remove() };
  }
</script>

<div class="actions" use:portal in:sceneIn|global out:sceneOut|global>{@render children()}</div>

<style>
  /*
   * The main row: bigger buttons than elsewhere, and the last one (the one to press now) takes
   * the room the others leave. Wraps on a narrow screen, the main button keeping its own row.
   */
  .actions {
    --button-pad-y: 0.7em;
    --button-pad-x: 1.4em;
    display: flex;
    justify-content: flex-end;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 0.6em;
    font-family: var(--font-ui);
    font-size: 1.15em;
  }
  .actions > :global(button:last-child) {
    flex: 1 1 8em;
  }
  /* A line of text alone in the row (such as the watching mark) stays centred. */
  .actions > :global(p) {
    flex: 1;
    margin: 0;
    text-align: center;
  }
</style>
