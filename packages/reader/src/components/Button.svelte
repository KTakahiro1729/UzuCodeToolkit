<!--
  A button on any screen (docs/design/chrome.md, Buttons, and design.md, Look by role). Always a capsule.
  `primary` is the next step, filled; one screen has at most one primary at a time. `secondary`
  is any other action, cancel and undo: no fill, a 1px --color-line edge. `pressed` marks a
  choice that is yours now (such as your vote) with the primary's fill. A button greys only
  while it cannot be tapped: --color-button-off fill, quiet text and no edge, so it never looks
  like a secondary button. Every variant keeps the same outer size.
  `on` is for a toggle (the next button once tapped): while on it is outlined with a 2px solid
  dark edge on a white fill and carries a tick, and tapping it again takes the tap back. Its label
  stays the same. Red is not used for it: red means a dangerous action and nothing else.
  `note` is a short sentence in the button under its label, for the one case that needs it: why
  it cannot be pressed, what it is waiting for, or that it moves everyone. It is small and quiet,
  never on a button that can be pressed and says what it does by its label alone.
  `danger` is a secondary button whose label and edge take --color-danger, for an action that
  loses what a player made. It never goes last in the footer's main row (the last one is the
  button to press now); put it before that one.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'primary',
    pressed = undefined,
    on = undefined,
    disabled = false,
    label = undefined,
    note = undefined,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'secondary' | 'danger';
    /** For a choice that stays selected; leave out for a plain button. */
    pressed?: boolean;
    /** For a toggle: true while it is on (tapping takes it back); leave out for a plain button. */
    on?: boolean;
    disabled?: boolean;
    /** The accessible name, for a button whose visible content is a mark alone. */
    label?: string;
    /** A short sentence under the label (see above). */
    note?: string;
    onclick: () => void;
    children: Snippet;
  } = $props();
</script>

<button type="button" data-variant={variant} aria-pressed={on ?? pressed} aria-label={label} class:with-note={note} data-on={on ? '' : undefined} {disabled} {onclick}>{#if note}<span class="label">{@render children()}</span><span class="note" data-uzu-part="note">{note}</span>{:else}{@render children()}{/if}</button>

<style>
  button {
    align-self: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    margin: 0;
    padding: var(--button-pad-y, 0.45em) var(--button-pad-x, 1.2em);
    border: 1px solid transparent;
    border-radius: 999px;
    background: var(--color-mine-current);
    color: var(--color-mine-text);
    font: inherit;
    font-family: var(--font-ui);
    cursor: pointer;
  }
  button[data-variant='secondary'] {
    background: none;
    border-color: var(--color-line);
    color: var(--color-text);
  }
  button[data-variant='danger'] {
    background: none;
    border-color: var(--color-danger);
    color: var(--color-danger);
  }
  button[aria-pressed='true']:not([data-on]) {
    background: var(--color-mine-current);
    border-color: var(--color-mine-current);
    color: var(--color-mine-text);
  }
  /* On: a 2px dark edge instead of the 1px one, with the padding one pixel smaller to keep the size. */
  button[data-on] {
    padding: calc(var(--button-pad-y, 0.45em) - 1px) calc(var(--button-pad-x, 1.2em) - 1px);
    border-width: 2px;
    border-color: var(--color-text);
    background: var(--color-bubble);
    color: var(--color-text);
  }
  button:disabled {
    background: var(--color-button-off);
    border-color: transparent;
    color: var(--color-text-quiet);
    cursor: default;
  }
  /* With a note, the label and the note stack. */
  button.with-note {
    flex-direction: column;
    gap: 0;
  }
  .label {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3em;
    white-space: nowrap;
    /* A seven-character label (次のフェーズへ) must fit the fixed button width. */
    font-size: 0.92em;
  }
  /* The sentence under the label: quiet, no smaller than 16px, free to wrap on a narrow button. */
  .note {
    font-size: max(16px, 0.835em);
    line-height: 1.25;
    text-align: center;
    color: var(--color-text-quiet);
  }
  button[data-variant='primary']:not(:disabled):not([data-on]) .note {
    color: var(--color-mine-text);
  }
  /* A mark inside the label, such as the read-through's next mark. */
  button :global(svg) {
    width: 0.55em;
    height: 0.45em;
    fill: currentColor;
  }
</style>
