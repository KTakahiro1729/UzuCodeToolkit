<!--
  The work's phases in order, numbered, for a player to see where the game is and what comes next
  (docs/design.md, Phase list). Phases in a row that share a label (such as the handouts and the
  pause after them) are one entry. Content only: the footer's sheet gives it its title, background
  and close button. It fills the cell it sits in and scrolls itself, the current entry in view.
  Reading only: nothing here moves the game.
-->
<script lang="ts">
  import type { PhaseView } from '../flow';

  let {
    phases,
    at,
    ended,
  }: {
    /** The work's phases, in order (startFlow's `phases`). */
    phases: readonly Pick<PhaseView, 'label'>[];
    /** Index of the current phase (FlowState.at). */
    at: number;
    /** True once the game has ended: every phase is over (FlowState.ended). */
    ended: boolean;
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

  /** Bring the current entry into view as the list opens, without motion. */
  function intoView(node: HTMLElement): void {
    node.scrollIntoView({ block: 'nearest' });
  }
</script>

<ol>
  {#each entries as e, n (e.first)}
    {@const state = stateOf(e)}
    {#if state === 'now'}
      <li data-state={state} aria-current="step" use:intoView><span class="num">{n + 1}</span>{e.label}</li>
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
    max-height: 100%;
    overflow-y: auto;
    scrollbar-width: none;
    margin-block: 0;
    margin-inline: auto;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-family: var(--font-ui);
  }
  li {
    flex: none;
    display: flex;
    gap: 0.8em;
    padding: 0.6em 1em;
    border-radius: 0.6em;
    line-height: 1.5;
  }
  .num {
    min-width: 1.2em;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  /* Over: quieter. Being above the current entry already says so; no mark needed. */
  li[data-state='done'] {
    color: var(--color-text-quiet);
  }
  /* Where the game is now: the one entry with a background, in bold. */
  li[data-state='now'] {
    background: var(--color-bubble);
    font-weight: 700;
  }
</style>
