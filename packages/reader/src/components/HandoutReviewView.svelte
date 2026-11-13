<!--
  Post-game screen for a work with handouts (emptyPhase()): every part's handout and what its
  player filled in, so players can compare their answers. A row of parts on top, yours chosen
  first; under it that part's handout in the same tabs as the handout sheet, read-only. The tab
  stays when the part changes, so one setting can be compared across players. The next button
  (the end button in the last phase) is in the footer. `from` is the handout phase's ID.
-->
<script lang="ts">
  import type { Handout, HandoutState } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import { game } from '../store.svelte';
  import FooterActions from './FooterActions.svelte';
  import HandoutSheet from './HandoutSheet.svelte';
  import { sceneIn, sceneOut } from './motion';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let {
    part,
    names,
    send,
    last,
    handout,
    from,
    guide,
  }: PhaseViewProps<{ next: boolean }> & { handout: Handout; from: string; guide?: string } = $props();

  const handoutState = $derived(game.state?.phases[from] as HandoutState | undefined);
  // The parts with a handout, in the work's order.
  const shown = $derived(Object.keys(names).filter((p) => handout.parts[p]));
  let chosen = $state<string | null>(null);
  const who = $derived(chosen ?? part);
</script>

<div class="review" in:sceneIn|global out:sceneOut|global>
  <div class="parts" role="tablist">
    {#each shown as p (p)}
      <button type="button" role="tab" aria-selected={p === who} onclick={() => (chosen = p)}>{names[p]}</button>
    {/each}
  </div>
  {#if handoutState}
    <HandoutSheet {handout} state={handoutState} part={who} {names} ownLabel={STRINGS['handout.body']} {guide} memory="review" />
  {/if}
</div>
<FooterActions>
  <NextButton onclick={() => send('next')}>{STRINGS[last ? 'button.end' : 'button.next']}</NextButton>
</FooterActions>

<style>
  /* The row of parts, then the handout filling the rest. */
  .review {
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.6em;
  }
  /* At the handout's reading width, its left edge shared with the tabs under it. */
  .parts {
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    margin-inline: auto;
    display: flex;
    gap: 0.3em;
    overflow-x: auto;
    scrollbar-width: none;
    font-family: var(--font-ui);
  }
  /* Whose handout: a pill, the chosen one filled dark, a level above the handout's own tabs. */
  button {
    flex: none;
    margin: 0;
    padding: 0.4em 0.9em;
    border: none;
    border-radius: 999px;
    background: none;
    color: var(--color-text-quiet);
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
  }
  button[aria-selected='true'] {
    background: var(--color-text);
    color: var(--color-bubble);
    font-weight: 700;
  }
</style>
