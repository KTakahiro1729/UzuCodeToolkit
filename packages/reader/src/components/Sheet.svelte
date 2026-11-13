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

  /**
   * The sheet is a modal: while it shows, the screen under it cannot be reached by keyboard or
   * screen reader (the footer and the band stay usable), focus starts on the close button and
   * returns to what opened the sheet.
   */
  function modal(node: HTMLElement) {
    const opener = document.activeElement as HTMLElement | null;
    const covered = [...node.parentElement!.children].filter((el) => el !== node && !el.matches('footer, header'));
    for (const el of covered) (el as HTMLElement).inert = true;
    node.querySelector('button')?.focus();
    return {
      destroy() {
        for (const el of covered) (el as HTMLElement).inert = false;
        opener?.focus();
      },
    };
  }
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<section transition:fade={{ duration }} use:modal>
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
