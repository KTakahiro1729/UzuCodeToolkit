<!--
  The game-select phase's screen (gameSelectPhase()). Choosing: the games this many players can
  play, and the next button in the footer. Playing: the game's own screen; the band names the game. Once the
  game is done, a back button in the footer returns to the list; there is none before. The game's
  screen gets only the seats that play it as `parts`; a spectator (gameSelectPhase's
  `spectator`, passed here too) sees it with `me` not among them.
-->
<script lang="ts">
  import { gameAction, type GameSelectState, playersFor } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import type { GameView } from '../games';
  import { band } from '../store.svelte';
  import { sceneIn, sceneOut } from './motion';
  import FooterActions from './FooterActions.svelte';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    state,
    me,
    part,
    parts,
    names,
    send,
    last,
    games,
    spectator,
  }: PhaseViewProps<GameSelectState> & { games: readonly GameView[]; spectator?: string } = $props();

  const choices = $derived(games.filter((g) => playersFor(g, parts, spectator)));
  const playing = $derived(games.find((g) => g.id === state.game));
  const over = $derived(playing ? playing.logic.done(state.play) : false);

  $effect(() => {
    band.label = playing?.label ?? null;
    return () => (band.label = null);
  });
</script>

{#if playing}
  {#key playing.id}
    <div class="playing" in:sceneIn|global out:sceneOut|global>
      <div class="game">
        <playing.view
          state={state.play}
          {me}
          {part}
          parts={state.players ?? parts}
          {names}
          send={(name: string, payload?: Record<string, unknown>) => send(gameAction(playing.id, name), payload)}
          {last}
        />
      </div>
      {#if over}
        <FooterActions>
          <NextButton onclick={() => send('back')}>{STRINGS['button.back']}</NextButton>
        </FooterActions>
      {/if}
    </div>
  {/key}
{:else}
  <div class="choosing" in:sceneIn|global out:sceneOut|global>
    <ul>
      {#each choices as g (g.id)}
        <li><button type="button" class="choice" onclick={() => send('pick', { id: g.id })}>{g.label}</button></li>
      {/each}
    </ul>
  </div>
  <FooterActions>
    <NextButton onclick={() => send('next')}>{STRINGS['button.next']}</NextButton>
  </FooterActions>
{/if}

<style>
  /* The list, centred. */
  .choosing {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.6em;
    min-height: 0;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: min(100%, 14em);
    max-height: 100%;
    align-self: center;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  /* Two columns on a wide, short screen, so the list fits. */
  @media (orientation: landscape) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: min(100%, 24em);
    }
  }
  button {
    margin: 0;
    border: none;
    font: inherit;
    font-family: var(--font-ui);
    color: var(--color-text);
    cursor: pointer;
  }
  .choice {
    width: 100%;
    padding: 0.7em 1em;
    border-radius: 0.6em;
    background: var(--color-bubble);
  }
  /* The game fills the screen; the back button is in the footer. */
  .playing {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
  }
  .game {
    display: grid;
    min-height: 0;
  }
</style>
