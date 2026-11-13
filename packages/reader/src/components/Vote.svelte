<!--
  A vote (kit `Ballot`): what the vote is about, then a choice for each candidate you can vote
  for, and how many have not voted yet. Your vote stays selected and can change until the last
  voter votes. A seat that is not a voter sees only how many are left. The game shows the result
  once the ballot is closed (kit `ballotClosed`, `tally`, `soleTop`).
-->
<script lang="ts">
  import { type Ballot, notVoted } from '@uzu-toolkit/kit';
  import { fill } from '../fill';
  import Button from './Button.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    ballot,
    me,
    heading,
    label,
    self = false,
    vote,
  }: {
    ballot: Ballot;
    me: string;
    /** What the vote is about, such as who has the other word. */
    heading: string;
    /** A candidate's name on screen. */
    label: (candidate: string) => string;
    /** You can vote for yourself (as castVote's `self`). */
    self?: boolean;
    /** Sends your vote, for the game's action that calls castVote. */
    vote: (candidate: string) => void;
  } = $props();

  const voter = $derived(ballot.voters.includes(me));
  const choices = $derived(ballot.candidates.filter((c) => self || c !== me));
  const left = $derived(notVoted(ballot).length);
</script>

<div class="vote">
  {#if voter}
    <span class="quiet">{heading}</span>
    {#each choices as c (c)}
      <Button variant="secondary" pressed={ballot.votes[me] === c} onclick={() => vote(c)}>{label(c)}</Button>
    {/each}
  {/if}
  <p class="quiet">{fill(STRINGS['vote.waiting'], { n: left })}</p>
</div>

<style>
  .vote {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    font-family: var(--font-ui);
  }
  /* Each choice spans the column, like the list it is. */
  .vote > :global(button) {
    align-self: stretch;
  }
  .quiet {
    color: var(--color-text-quiet);
  }
  p {
    margin: 0;
    padding-top: 1em;
  }
</style>
