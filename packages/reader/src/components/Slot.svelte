<!--
  An item of the footer's row beside the main button (docs/design.md, Footer): an icon over a short
  name, plain text in the quiet colour and no capsule, so the one capsule that is filled stays the
  button to press now. With `onclick` it is a button (the handouts to read back, more time, the
  next phase); without it, it only shows something (the time left). `active` marks the open one,
  bold and underlined. The icon never stands alone: the name is always written. The icons are drawn here, not typed, so no font has to hold them.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    icon,
    onclick = undefined,
    disabled = false,
    active = false,
    class: extra = '',
    aside = false,
    children,
  }: {
    /** `sheet` (something to read), `clock` (time), `plus` (more), `next` (on to the next phase). */
    icon: 'sheet' | 'clock' | 'plus' | 'next' | 'pause' | 'play';
    onclick?: () => void;
    disabled?: boolean;
    /** The open one of several (the handouts' sheet). */
    active?: boolean;
    class?: string;
    /** Marks what a wide screen shows beside the screen instead (Frame hides it there). */
    aside?: boolean;
    children: Snippet;
  } = $props();
</script>

{#snippet mark()}
  <svg viewBox="0 0 16 16" aria-hidden="true">
    {#if icon === 'sheet'}<rect x="3" y="1.5" width="10" height="13" rx="1.5" /><path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" />
    {:else if icon === 'clock'}<circle cx="8" cy="8" r="6.2" /><path d="M8 4.5V8l2.5 1.5" />
    {:else if icon === 'pause'}<path d="M6 3.5v9M10 3.5v9" />
    {:else if icon === 'play'}<path d="M5 3l8 5-8 5z" />
    {:else if icon === 'plus'}<path d="M8 3v10M3 8h10" />
    {:else}<path d="M3 3.5l5 4.5-5 4.5M8.5 3.5L13.5 8l-5 4.5" />{/if}
  </svg>
{/snippet}

{#if onclick}
  <button type="button" class="slot {extra}" aria-pressed={active || undefined} {disabled} data-aside={aside ? '' : undefined} {onclick}>
    {@render mark()}<span class="name">{@render children()}</span>
  </button>
{:else}
  <span class="slot {extra}">{@render mark()}<span class="name">{@render children()}</span></span>
{/if}

<style>
  .slot {
    align-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0 0.25em;
    border: none;
    background: none;
    color: var(--color-text-quiet);
    font: inherit;
    font-family: var(--font-ui);
    font-size: max(16px, 0.87em);
    line-height: 1.2;
    text-align: center;
    /* A long name wraps to a second line rather than squeezing the main button. */
    max-width: 6.3em;
    overflow-wrap: anywhere;
  }
  button.slot {
    cursor: pointer;
  }
  svg {
    width: 1.45em;
    height: 1.45em;
    fill: none;
    stroke: var(--color-text);
    stroke-width: 1.4;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  button.slot:disabled svg {
    stroke: var(--color-text-quiet);
  }
  button.slot:disabled {
    cursor: default;
  }
  .slot[aria-pressed='true'] {
    color: var(--color-text);
    font-weight: 700;
  }
  .slot[aria-pressed='true'] .name {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
</style>
