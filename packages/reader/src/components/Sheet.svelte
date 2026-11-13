<!--
  A page opened from the footer over the current screen, which keeps running under it: its title
  and a close button in one row, the content under them. It hides the screen under it fully, so
  the two never show through each other. Fades in and out (opacity only).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from './Button.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } = $props();
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;
</script>

<section transition:fade={{ duration }}>
  <div class="head">
    <h2>{title}</h2>
    <Button variant="secondary" onclick={onclose}>{STRINGS['sheet.close']}</Button>
  </div>
  <div class="body">{@render children()}</div>
</section>

<style>
  /* Fills the screen's cell, on the page colour, above the screen. */
  section {
    z-index: 1;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6em;
    background: var(--color-bg);
  }
  /* The content fills the rest; content that does not scroll by itself scrolls here. */
  .body {
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  /* The title and close share the content's reading width. */
  .head {
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    margin-inline: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-ui);
  }
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-size: max(16px, 0.8em);
    font-weight: 700;
  }
</style>
