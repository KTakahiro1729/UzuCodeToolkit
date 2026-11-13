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

  let { place = 'main', children }: { place?: 'main' | 'aside'; children: Snippet } = $props();

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
  /* One row, centred in its cell; wraps on a narrow screen. */
  .actions {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6em;
    font-family: var(--font-ui);
  }
</style>
