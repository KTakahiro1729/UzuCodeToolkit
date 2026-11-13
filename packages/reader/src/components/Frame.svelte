<!--
  The screen every scene sits in: the top band (players and the phase), the footer along the
  bottom edge (the screen's main actions, put there with FooterActions, and the read-back
  buttons) and, between them, one cell for the scene. Scenes share the cell, so the old one can
  fade out where the new one fades in.
  A wide screen (40em wide and 480px tall, in the screen's own em) has room for 2 columns, a
  wider one (60em) for 3. There `aside` (what can be read back, such as the handouts) takes every
  column but the last, the scene takes the last, and the footer's actions centre under the scene.
  Elsewhere `aside` is hidden. A read-back button marked `data-aside` names what `aside` shows, so
  it is hidden while `aside` is.
-->
<script lang="ts">
  import type { Part } from '@uzu-toolkit/kit';
  import type { Snippet } from 'svelte';
  import { footerSlots } from '../store.svelte';
  import TopBand from './TopBand.svelte';

  let {
    parts,
    myPart,
    done = [],
    phase,
    nav,
    aside,
    children,
  }: {
    /** Every seat's part, in the work's order. */
    parts: readonly Part[];
    /** The part you play (State parts[seat]). */
    myPart: string | undefined;
    /** Parts done with the current phase, checked in the band. */
    done?: readonly string[];
    /** The phase label in the band: the scene's name, from a key or the work's data. */
    phase: string;
    /** Buttons that open what can be read back (the phase list, the handouts); none for a one-phase work. */
    nav?: Snippet;
    /** What stays in view beside the scene on a wide screen; hidden on narrower ones. */
    aside?: Snippet;
    children: Snippet;
  } = $props();

  // The footer's height, for the space the screen keeps above it.
  let footerHeight = $state(0);
</script>

<div class="screen">
<main class:aside={!!aside} style:--footer-height={`${footerHeight}px`}>
  <TopBand {parts} {myPart} {done} {phase} />
  <!-- Before the screen, so its cells are there when the screen puts its actions in. -->
  <footer bind:offsetHeight={footerHeight}>
    <div class="act">
      <div class="cell" bind:this={footerSlots.aside}></div>
      <div class="cell" bind:this={footerSlots.main}></div>
    </div>
    {#if nav}<nav>{@render nav()}</nav>{/if}
  </footer>
  {#if aside}<aside>{@render aside()}</aside>{/if}
  {@render children()}
</main>
</div>

<style>
  :global(body) {
    margin: 0;
  }
  /* The query container for the column count; its em is the screen's own. */
  .screen {
    position: fixed;
    inset: 0;
    container: screen / size;
    /* Sizes are in em; the base scales with the screen's short side. */
    font-size: clamp(16px, 4.4vmin, 28px);
  }
  main {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    /* One cell: the chat and the end screen overlap while one gives way to the other. */
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    /* The HUD's bottom is measured from the safe area's top; the top band sits beside the HUD. */
    /* Below the HUD and the band, with a gap so a line cut off by scrolling reads as the list's edge. */
    padding: calc(var(--band-bottom) + 0.5em) calc(var(--safe-right, 0px) + 0.8em)
      calc(var(--footer-height) + 0.5em) calc(var(--safe-left, 0px) + 0.8em);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    overflow: hidden;
    user-select: none;
  }
  main > :global(:not(footer)) {
    grid-area: 1 / 1;
  }
  aside {
    display: none;
  }
  /*
   * Columns: the aside takes all but the last, the scene (and a sheet over it) the last. The
   * footer keeps the same columns, so its actions centre under the scene and the read-back
   * buttons sit under the aside.
   */
  @container screen (min-width: 40em) and (min-height: 480px) {
    main.aside {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 1.2em;
    }
    main.aside > :global(:not(footer)) {
      grid-area: 1 / -2;
    }
    main.aside > aside {
      grid-area: 1 / 1 / 2 / -2;
      min-height: 0;
      display: grid;
      grid-template-rows: minmax(0, 1fr);
    }
    main.aside > footer {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 1.2em;
    }
    main.aside .act {
      grid-column: -2;
      grid-row: 1;
    }
    main.aside nav {
      grid-column: 1;
      grid-row: 1;
    }
    main.aside nav :global([data-aside]) {
      display: none;
    }
  }
  @container screen (min-width: 60em) and (min-height: 480px) {
    main.aside,
    main.aside > footer {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  /*
   * The main action area, white and full width along the bottom edge as the band's counterpart.
   * Landscape: one row, the read-back buttons at the left and the actions centred on the screen.
   * Portrait: the actions in a row of their own, the read-back buttons under them.
   */
  footer {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: border-box;
    min-height: calc(var(--safe-bottom, 0px) + var(--footer-h));
    padding: 0.5em calc(var(--safe-right, 0px) + 0.8em) calc(var(--safe-bottom, 0px) + 0.5em)
      calc(var(--safe-left, 0px) + 0.8em);
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    column-gap: 0.6em;
    background: var(--color-bubble);
  }
  .act {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0.6em;
  }
  nav {
    grid-column: 1;
    grid-row: 1;
    display: flex;
    gap: 0.2em;
  }
  @media (orientation: portrait) {
    footer {
      grid-template-columns: minmax(0, 1fr);
      row-gap: 0.4em;
    }
    .act {
      grid-column: 1;
    }
    nav {
      grid-row: 2;
    }
  }
  /* The old screen's actions and the new one's share the cell while one gives way to the other. */
  .cell {
    display: grid;
  }
  .cell > :global(*) {
    grid-area: 1 / 1;
  }
  .cell:empty {
    display: none;
  }
</style>
