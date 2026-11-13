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
    children,
  }: {
    /** Every seat's part, in the work's order. */
    parts: readonly Part[];
    /** The part you play (State parts[seat]). */
    myPart: string | undefined;
    /** The phase label in the band: the scene's name, from a key or the work's data. */
    phase: string;
    children: Snippet;
  } = $props();
</script>

<main>
  <TopBand {parts} {myPart} {phase} />
  {@render children()}
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
</style>
