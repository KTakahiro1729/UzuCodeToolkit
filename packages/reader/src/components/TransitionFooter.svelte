<!--
  The footer of a phase that ends by time (docs/decisions: a phase moves on by time or by people).
  The time left is the leftmost item, large and dark; its operations follow it (pause or resume,
  then `extras`, such as more time); the main button, if the phase has one, is the children and
  stays at the right edge. A phase that only waits for its time has no main button: give no children.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import FooterActions from './FooterActions.svelte';
  import Slot from './Slot.svelte';
  import STRINGS from '../strings';
  import { formatClock } from '@uzu-toolkit/kit';
  import { band } from '../store.svelte';

  /** From this many seconds left, the clock is shown heavier and darker. */
  const URGENT_SECONDS = 30;

  let {
    left,
    paused = false,
    onpause = undefined,
    onresume = undefined,
    clockAt = 'footer',
    extras = undefined,
    children = undefined,
  }: {
    /** Whole seconds left. */
    left: number;
    paused?: boolean;
    /** Given with `onresume`, the pause item shows. */
    onpause?: () => void;
    onresume?: () => void;
    /** Where the time left sits: the footer's leftmost item, or beside the phase label in the band (pause and more time stay in the footer). */
    clockAt?: 'footer' | 'band';
    extras?: Snippet;
    /** The main button (and any button fused with it). */
    children?: Snippet;
  } = $props();

  const urgent = $derived(left <= URGENT_SECONDS && !paused);
  $effect(() => {
    if (clockAt !== 'band') return;
    band.clock = { text: formatClock(left), urgent };
    return () => {
      band.clock = null;
    };
  });
</script>

<FooterActions place="aside">
  {#if clockAt === 'footer'}
    <Slot icon="clock" class="time{paused ? ' paused' : ''}"><span>{STRINGS['time.left']}</span> <b class="clock" class:urgent>{formatClock(left)}</b></Slot>
  {/if}
  {#if onpause && onresume}
    {#if paused}
      <Slot icon="play" onclick={onresume}>{STRINGS['footer.resume']}</Slot>
    {:else}
      <Slot icon="pause" onclick={onpause}>{STRINGS['footer.pause']}</Slot>
    {/if}
  {/if}
  {@render extras?.()}
</FooterActions>
{#if children}<FooterActions>{@render children()}</FooterActions>{/if}

<style>
  /* The time left: large and dark, the one number to watch; quiet while paused. */
  :global(.slot.time .clock) {
    font-size: 1.3em;
    font-weight: 700;
    line-height: 1.1;
    color: var(--color-text);
    font-variant-numeric: tabular-nums;
  }
  /* The name "残り" says what the number is, so the clock mark is left out: the room goes to the digits. */
  :global(.slot.time .name) {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  :global(.slot.time svg) {
    display: none;
  }
  :global(.slot.time .clock.urgent) {
    font-weight: 800;
    -webkit-text-stroke: 0.04em currentColor;
  }
  :global(.slot.time.paused .clock) {
    color: var(--color-text-quiet);
  }
</style>
