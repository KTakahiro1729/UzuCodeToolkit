<!--
  The button that moves the game on: the advance button of the read-through, and the next
  button of other scenes. Filled for whoever can tap it, greyed for the others.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let { disabled = false, onclick, children }: { disabled?: boolean; onclick: () => void; children: Snippet } = $props();
</script>

<button type="button" {disabled} {onclick}>{@render children()}</button>

<style>
  button {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    padding: 0.45em 1.2em;
    border: none;
    border-radius: 999px;
    background: var(--color-mine-current);
    color: var(--color-mine-text);
    font: inherit;
    font-family: var(--font-ui);
    cursor: pointer;
  }
  button:disabled {
    background: var(--color-button-off);
    color: var(--color-text-quiet);
    cursor: default;
  }
  /* The next mark. */
  button :global(svg) {
    width: 0.55em;
    height: 0.45em;
    fill: currentColor;
  }
</style>
