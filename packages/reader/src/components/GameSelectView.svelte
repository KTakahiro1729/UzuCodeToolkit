<!--
  The game-select phase's screen (gameSelectPhase()). Choosing: the games this many players can
  play, then the next button. Playing: the game's own screen; the band names the game. Once the
  game is done, a back button under it returns to the list; there is none before. The game's
  screen gets only the seats that play it as `parts`; a spectator (gameSelectPhase's
  `spectator`, passed here too) sees it with `me` not among them and `watching` set.
-->
<script lang="ts">
  import { gameAction, type GameSelectState, playersFor } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import type { GameView } from '../games';
  import { fill } from '../fill';
  import { band } from '../store.svelte';
  import Guide from './Guide.svelte';
  import { sceneIn, sceneOut } from './motion';
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
    guide,
    finish,
  }: PhaseViewProps<GameSelectState> & {
    games: readonly GameView[];
    spectator?: string;
    /** What to do now, at the top of the list. */
    guide?: string;
    /** The label of the button that leaves the list for the next phase; `button.next` without one. */
    finish?: string;
  } = $props();

  const choices = $derived(
    games.flatMap((g) => {
      const players = playersFor(g, parts, spectator);
      return players ? [{ game: g, players }] : [];
    }),
  );
  /** Under a game's name: how many play, who watches, and the game's own line. */
  const about = (players: Record<string, string>, description?: string): string => {
    const n = Object.keys(players).length;
    const out = [fill(STRINGS['gameSelect.players'], { n })];
    if (n < Object.keys(parts).length && spectator) out.push(fill(STRINGS['gameSelect.watches'], { name: names[spectator] }));
    if (description) out.push(description);
    return out.join(STRINGS['list.sep']);
  };
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
          watching={!(me in (state.players ?? parts))}
          {names}
          send={(name: string, payload?: Record<string, unknown>) => send(gameAction(playing.id, name), payload)}
          {last}
        />
      </div>
      {#if over}
        <NextButton onclick={() => send('back')}>{STRINGS['button.back']}</NextButton>
      {/if}
    </div>
  {/key}
{:else}
  <div class="choosing" in:sceneIn|global out:sceneOut|global>
    {#if guide}<Guide text={guide} />{/if}
    <ul>
      {#each choices as { game: g, players } (g.id)}
        <li>
          <button type="button" class="choice" onclick={() => send('pick', { id: g.id })}>
            <span class="name">{g.label}</span>
            <span class="about">{about(players, g.description)}</span>
          </button>
        </li>
      {/each}
    </ul>
    <NextButton onclick={() => send('next')}>{finish ?? STRINGS['button.next']}</NextButton>
  </div>
{/if}

<style>
  /* The list and the next button, centred as one group. */
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
    width: min(100%, 22em);
    max-height: 100%;
    align-self: center;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;
  }
  /* Two columns on a wide, short screen, so the list fits above the next button. */
  @media (orientation: landscape) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: min(100%, 40em);
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
  /* The name, and under it the quieter line on players and the game; left-aligned like the guide. */
  .choice {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15em;
    padding: 0.6em 1em;
    border-radius: 0.6em;
    background: var(--color-bubble);
    text-align: left;
  }
  .name {
    font-weight: bold;
  }
  .about {
    color: var(--color-text-quiet);
  }
  .choosing > :global(p) {
    max-width: 22em;
  }
  /* The game fills the screen; the back button sits under it. */
  .playing {
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0.6em;
    min-height: 0;
  }
  .game {
    display: grid;
    min-height: 0;
  }
  .playing > :global(button) {
    justify-self: center;
  }
</style>
