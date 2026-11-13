<!--
  The work's phases in order, numbered, for a player to see where the game is and what comes next
  (docs/design.md, Phase list). Phases in a row that share a label (such as the handouts and the
  pause after them) are one entry. Each entry is a card of its own. Content only: the footer's
  sheet gives it its title, background and close button. By default it fills the cell it sits in
  and scrolls itself, the current entry in view; `inline` leaves it at its full height inside a
  screen that scrolls (FlowStrip).
  Reading only: nothing here moves the game, so no card is tappable or looks it. The current
  entry's card is tinted and bold; entries already over are quieter.
-->
<script lang="ts">
  import type { PhaseView } from '../flow';

  let {
    phases,
    at,
    ended,
    inline = false,
  }: {
    /** The work's phases, in order (startFlow's `phases`). */
    phases: readonly Pick<PhaseView, 'label'>[];
    /** Index of the current phase (FlowState.at). */
    at: number;
    /** True once the game has ended: every phase is over (FlowState.ended). */
    ended: boolean;
    /** Show every entry at full height, for a screen that scrolls (no scrolling of its own). */
    inline?: boolean;
  } = $props();

  const entries = $derived(
    phases.reduce<{ label: string; first: number; last: number }[]>((list, { label }, i) => {
      const prev = list.at(-1);
      if (prev && prev.label === label) prev.last = i;
      else list.push({ label, first: i, last: i });
      return list;
    }, []),
  );
  const stateOf = (e: { first: number; last: number }): 'done' | 'now' | 'next' =>
    ended || e.last < at ? 'done' : e.first <= at ? 'now' : 'next';

  /** Bring the current entry into view as the list opens, without motion; not when inline. */
  function intoView(node: HTMLElement, on: boolean): void {
    if (on) node.scrollIntoView({ block: 'nearest' });
  }
</script>

<ol class:scroll={!inline} class:inline>
  {#each entries as e, n (e.first)}
    {@const state = stateOf(e)}
    {#if state === 'now'}
      <li data-state={state} aria-current="step" use:intoView={!inline}><span class="num">{n + 1}</span>{e.label}</li>
    {:else}
      <li data-state={state}><span class="num">{n + 1}</span>{e.label}</li>
    {/if}
  {/each}
</ol>

<style>
  /* One column at the chat's reading width, from the top; it scrolls when the phases do not fit. */
  ol {
    align-self: start;
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    margin-block: 0;
    margin-inline: auto;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    font-family: var(--font-ui);
  }
  ol:not(.inline) {
    max-height: 100%;
    overflow-y: auto;
  }
  /* A card for each entry, the number at its start. Larger than body text: the list is read in a
     glance, not studied. */
  li {
    flex: none;
    display: flex;
    gap: 0.8em;
    padding: 0.7em 1em;
    border-radius: var(--radius-read);
    background: var(--color-bubble);
    font-size: 1.1em;
    line-height: 1.5;
  }
  .num {
    min-width: 1.2em;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  /* Over: quieter text. Sitting above the current card already says so; no mark needed. */
  li[data-state='done'] {
    color: var(--color-text-quiet);
  }
  /* Where the game is now: the tinted card and bold text. Not the button's saturated blue, which
     means "tap". */
  li[data-state='now'] {
    color: var(--color-text);
    background: var(--color-bubble-mine);
    font-weight: 700;
  }
</style>
