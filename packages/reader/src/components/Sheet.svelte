<!--
  A page opened from the footer over the current screen, which keeps running under it: a panel
  rising from the footer, its bottom edge flush against it and the sides at the screen's edge
  (where the screen is narrow enough), only the top corners round, with its title and a close
  button in one row, the content under them. The screen stays in view behind it, dimmed, so the
  reader keeps their place; tapping the dimmed part closes the sheet like the close button does.
  Slides up and fades in, and the reverse (transform and opacity only).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from './Button.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let { title, onclose, children }: { title: string; onclose: () => void; children: Snippet } = $props();
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
  /** Rises from a little below its place while it fades in (transform and opacity only), and the reverse. */
  const rise = (_node: Element) => ({ duration, css: (t: number) => `opacity: ${t}; transform: translateY(${(1 - t) * 2}em)` });

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

<section data-uzu-part="sheet" use:modal>
  <!-- Escape and the close button are the keyboard's ways out; the dimmed screen is a tap target only. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" data-overflow-ok transition:fade|global={{ duration }} onclick={onclose}></div>
  <div class="panel" data-overflow-parent-ok transition:rise|global>
    <div class="head" data-uzu-part="sheet-head">
      <h2>{title}</h2>
      <Button variant="secondary" onclick={onclose}>{STRINGS['sheet.close']}</Button>
    </div>
    <div class="scroll body">{@render children()}</div>
  </div>
</section>

<style>
  /*
   * The scrim dims the screen's whole area (the cell and the page margin around it, not the band
   * or the footer, which stay as they are); the panel floats above it, anchored to the bottom,
   * and leaves a strip of the screen showing at the top. Both reach past the section on purpose
   * (data-overflow-ok on the scrim, data-overflow-parent-ok on the panel, for the screen preview's
   * overflow check, which still checks the panel against the screen): nothing clips them.
   */
  section {
    z-index: 1;
    min-height: 0;
    position: relative;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  .scrim {
    position: absolute;
    inset: -0.5em -0.8em;
    background: var(--color-scrim, rgb(36 41 47 / 0.45));
  }
  .panel {
    position: relative;
    box-sizing: border-box;
    align-self: end;
    justify-self: center;
    /* Out over the screen's padding, so the bottom and the sides sit against the footer and the edges. */
    width: calc(100% + 1.6em);
    max-width: 32em;
    translate: 0 0.5em;
    height: calc(100% - 1.2em);
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6em;
    padding: 0.6em 0.8em;
    border-radius: var(--radius-read) var(--radius-read) 0 0;
    background: var(--color-bg);
  }
  /* The content fills the rest; content that does not scroll by itself scrolls here. */
  .body {
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  .head {
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
