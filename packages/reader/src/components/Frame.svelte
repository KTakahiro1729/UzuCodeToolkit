<!--
  The screen every scene sits in: the top band (players and the phase) and, under it, one cell
  for the scene. Scenes share the cell, so the old one can fade out where the new one fades in.
-->
<script lang="ts">
  import type { Part } from '@uzu-toolkit/kit';
  import type { Snippet } from 'svelte';
  import TopBand from './TopBand.svelte';

  let {
    parts,
    myPart,
    phase,
    footer,
    children,
  }: {
    /** Every seat's part, in the work's order. */
    parts: readonly Part[];
    /** The part you play (State parts[seat]). */
    myPart: string | undefined;
    /** The phase label in the band: the scene's name, from a key or the work's data. */
    phase: string;
    /** The footer's buttons, in a white row along the bottom edge; none for a one-phase work. */
    footer?: Snippet;
    children: Snippet;
  } = $props();
</script>

<main class:footed={footer}>
  <TopBand {parts} {myPart} {phase} />
  {@render children()}
  {#if footer}
    <footer>{@render footer()}</footer>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
  }
  main {
    position: fixed;
    inset: 0;
    box-sizing: border-box;
    /* One cell: the chat and the end screen overlap while one gives way to the other. */
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    /* The HUD's bottom is measured from the safe area's top; the top band sits beside the HUD. */
    /* Below the HUD and the band, with a gap so a line cut off by scrolling reads as the list's edge. */
    padding: calc(var(--band-bottom) + 0.5em) calc(var(--safe-right, 0px) + 0.8em)
      calc(var(--safe-bottom, 0px) + 0.8em) calc(var(--safe-left, 0px) + 0.8em);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    /* Sizes are in em; the base scales with the screen's short side. */
    font-size: clamp(16px, 4.4vmin, 28px);
    overflow: hidden;
    user-select: none;
  }
  main > :global(*) {
    grid-area: 1 / 1;
  }
  /* Above the footer as well, with the same gap as under the band. */
  main.footed {
    padding-bottom: calc(var(--safe-bottom, 0px) + var(--footer-h) + 0.5em);
  }
  /*
   * Like the band, white and full width, reaching the bottom edge; its buttons start at the
   * content's left edge.
   */
  footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    height: calc(var(--safe-bottom, 0px) + var(--footer-h));
    box-sizing: border-box;
    padding: 0 calc(var(--safe-right, 0px) + 0.8em) var(--safe-bottom, 0px) calc(var(--safe-left, 0px) + 0.8em);
    display: flex;
    align-items: center;
    gap: 0.4em;
    background: var(--color-bubble);
    font-family: var(--font-ui);
    font-size: 16px;
  }
</style>
