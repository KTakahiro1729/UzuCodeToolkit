<!--
  A button on any screen (docs/design.md, Buttons). `primary` is the next step, filled; one
  screen has at most one primary at a time. `secondary` is any other choice, white. `pressed`
  marks a secondary choice that is yours now (such as your vote) with the primary's fill. A
  button greys only while it cannot be tapped.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'primary',
    pressed = undefined,
    disabled = false,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'secondary';
    /** For a choice that stays selected; leave out for a plain button. */
    pressed?: boolean;
    disabled?: boolean;
    onclick: () => void;
    children: Snippet;
  } = $props();
</script>

<button type="button" data-variant={variant} aria-pressed={pressed} {disabled} {onclick}>{@render children()}</button>

<style>
  button {
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
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
  button[data-variant='secondary'] {
    background: var(--color-bubble);
    color: var(--color-text);
  }
  button[aria-pressed='true'] {
    background: var(--color-mine-current);
    color: var(--color-mine-text);
  }
  button:disabled {
    background: var(--color-button-off);
    color: var(--color-text-quiet);
    cursor: default;
  }
  /* A mark inside the label, such as the read-through's next mark. */
  button :global(svg) {
    width: 0.55em;
    height: 0.45em;
    fill: currentColor;
  }
</style>
