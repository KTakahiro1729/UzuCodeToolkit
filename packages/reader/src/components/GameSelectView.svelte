<!--
  The game-select phase's screen (gameSelectPhase()). Choosing: the games this many players can
  play, each with how many play, who watches and the game's own line; a tap selects one (on this screen only), and the play button in the footer starts it for
  everyone. The next button beside it is not filled, since leaving the phase is not the next step.
  Playing: the game's own screen, scrolling if it runs long; the band names the game. The footer
  holds the back button once the game is done, and before that says that you watch, for a seat
  that sits the game out (gameSelectPhase's `spectator`, passed here too). The game's screen gets only the seats
  that play it as `parts`, and `watching` for a seat that is not among them.
-->
<script lang="ts">
  import { gameAction, type GameSelectState, playersFor } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import type { GameView } from '../games';
  import { fill } from '../fill';
  import { band } from '../store.svelte';
  import Button from './Button.svelte';
  import FooterActions from './FooterActions.svelte';
  import Guide from './Guide.svelte';
  import { sceneIn, sceneOut } from './motion';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    state: phase,
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
  const playing = $derived(games.find((g) => g.id === phase.game));
  const over = $derived(playing ? playing.logic.done(phase.play) : false);
  const watching = $derived(!(me in (phase.players ?? parts)));

  // The game this player has selected on the list; nothing starts until the play button.
  let selected = $state<string | null>(null);
  $effect(() => {
    if (playing) selected = null;
  });

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
          state={phase.play}
          {me}
          {part}
          parts={phase.players ?? parts}
          {watching}
          {names}
          send={(name: string, payload?: Record<string, unknown>) => send(gameAction(playing.id, name), payload)}
          {last}
        />
      </div>
    </div>
    <!-- In the footer: back once the game is done, before that whether you watch. -->
    {#if over}
      <FooterActions><Button onclick={() => send('back')}>{STRINGS['button.back']}</Button></FooterActions>
    {:else if watching}
      <FooterActions><p>{STRINGS['game.watching']}</p></FooterActions>
    {/if}
  {/key}
{:else}
  <div class="choosing" in:sceneIn|global out:sceneOut|global>
    <div class="list">
      {#if guide}<Guide text={guide} />{/if}
      <ul>
        {#each choices as { game: g, players } (g.id)}
          <li>
            <Button variant="secondary" pressed={selected === g.id} onclick={() => (selected = g.id)}>
              <span class="name">{g.label}</span>
              <span class="about" class:on={selected === g.id}>{about(players, g.description)}</span>
            </Button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <FooterActions>
    <Button variant="secondary" onclick={() => send('next')}>{finish ?? STRINGS['button.next']}</Button>
    <Button disabled={selected === null} onclick={() => selected && send('pick', { id: selected })}>
      {STRINGS['game.play']}
    </Button>
  </FooterActions>
{/if}

<style>
  /* The guide and the list, centred. */
  .choosing {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1.6em;
    min-height: 0;
  }
  /* The guide and the list scroll together, so the guide leaves the view with them. */
  .list {
    display: flex;
    flex-direction: column;
    gap: 1em;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: min(100%, 22em);
    align-self: center;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Three columns on a wide, short screen, so the list (two lines a game) fits above the buttons. */
  @media (orientation: landscape) {
    ul {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      width: min(100%, 48em);
    }
  }
  /* A game on the list: a white block as wide as the list, not a round button. */
  li > :global(button) {
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15em;
    padding: 0.6em 1em;
    border-radius: 0.6em;
    text-align: left;
  }
  /* The name, and under it the quieter line on players and the game. */
  .name {
    font-weight: bold;
  }
  .about {
    color: var(--color-text-quiet);
  }
  /* On the selected game's fill, the line takes the fill's text colour, for contrast. */
  .about.on {
    color: inherit;
  }
  /* The game scrolls in its own space; the row under it is always there. */
  .playing {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    min-height: 0;
  }
  .game {
    display: grid;
    min-height: 0;
    overflow-y: auto;
  }
  p {
    margin: 0;
    padding: 0.45em 0;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
  }
</style>
