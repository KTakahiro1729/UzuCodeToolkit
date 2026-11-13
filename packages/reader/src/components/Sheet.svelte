<!--
  A page opened from the footer over the current screen, which keeps running under it: a panel
  floating above the screen with its title and a close button in one row, the content under
  them. The screen stays in view behind it, dimmed, so the reader keeps their place; tapping the
  dimmed part closes the sheet like the close button does. Fades in and out (opacity only).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { fade } from 'svelte/transition';
  import Button from './Button.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

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
  <!-- Escape and the close button are the keyboard's ways out; the dimmed screen is a tap target only. -->
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div class="scrim" onclick={onclose}></div>
  <div class="panel">
    <div class="head">
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
   * and leaves a strip of the screen showing at the top.
   */
  section {
    z-index: 1;
    min-height: 0;
    position: relative;
    margin: -0.5em -0.8em;
    padding: 0.5em 0.8em;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  .scrim {
    position: absolute;
    inset: 0;
    background: var(--color-scrim);
  }
  .panel {
    position: relative;
    box-sizing: border-box;
    align-self: end;
    justify-self: center;
    width: 100%;
    max-width: 32em;
    height: calc(100% - 2.2em);
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6em;
    padding: 0.6em 0.8em;
    border-radius: var(--radius-read);
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
