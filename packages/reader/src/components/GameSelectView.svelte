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
  import Slot from './Slot.svelte';
  import Guide from './Guide.svelte';
  import { sceneIn, sceneOut } from './motion';
  // UI strings by key.
  import STRINGS from '../strings';

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
    facilitator,
    guide,
    memo,
    finish,
  }: PhaseViewProps<GameSelectState> & {
    games: readonly GameView[];
    spectator?: string;
    /** The part that picks, goes back and moves on (gameSelectPhase's `facilitator`, passed here too). */
    facilitator?: string;
    /** A note for each part, at the top of the list under the guide (part ID -> text). */
    memo?: Record<string, string>;
    /** What to do now, at the top of the list. */
    guide?: string;
    /** The label of the button that leaves the list for the next phase; `button.nextPhase` without one. */
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
  /** Only the facilitator's part moves things along; the others wait and see who. */
  const blocked = $derived(facilitator !== undefined && part !== facilitator);
  const waitNote = $derived(blocked ? fill(STRINGS['status.facilitator'], { name: names[facilitator ?? ''] ?? '' }) : undefined);
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
    <div class="playing" data-uzu-part="playing" in:sceneIn|global out:sceneOut|global>
      <div class="scroll game">
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
      <FooterActions><Button disabled={blocked} note={waitNote} onclick={() => send('back')}>{STRINGS['button.back']}</Button></FooterActions>
    {:else if watching}
      <FooterActions><p>{STRINGS['game.watching']}</p></FooterActions>
    {/if}
  {/key}
{:else}
  <div class="choosing" in:sceneIn|global out:sceneOut|global>
    <div class="scroll list" data-uzu-part="list">
      {#if guide}<Guide text={guide} />{/if}
      {#if memo?.[part]}<Guide text={memo[part]} />{/if}
      <ul>
        {#each choices as { game: g, players } (g.id)}
          <li data-uzu-part="list-row">
            <Button variant="secondary" disabled={blocked} pressed={selected === g.id} onclick={() => (selected = g.id)}>
              <span class="name" data-uzu-part="list-name"
                >{#if selected === g.id}<svg class="tick" viewBox="0 0 12 10" aria-hidden="true"
                    ><path d="M1 5l3.5 3.5L11 1.5" /></svg
                  >{/if}{g.label}</span
              >
              <span class="about" data-uzu-part="list-about" class:on={selected === g.id}>{about(players, g.description)}</span>
            </Button>
          </li>
        {/each}
      </ul>
    </div>
  </div>
  <FooterActions place="aside">
    <Slot icon="next" disabled={blocked} onclick={() => send('next')}>{finish ?? STRINGS['button.nextPhase']}</Slot>
  </FooterActions>
  <FooterActions>
    <Button disabled={blocked || selected === null} note={waitNote ?? (selected === null ? STRINGS['status.pickGame'] : undefined)} onclick={() => selected && send('pick', { id: selected })}>
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
  /* A game on the list: a choice (docs/design.md, Look by role), as wide as the list, not a
     capsule: no fill and a line edge; the selected one takes the primary fill. The attribute
     selectors outweigh Button's own variant and pressed rules. */
  li > :global(button[data-variant='secondary']) {
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15em;
    padding: 0.6em 1em;
    border: 1px solid var(--color-line);
    border-radius: var(--radius-control);
    background: none;
    color: var(--color-text);
    text-align: left;
  }
  li > :global(button[aria-pressed='true']) {
    background: var(--color-mine-current);
    color: var(--color-mine-text);
  }
  /* The name, and under it the quieter line on players and the game. */
  .name {
    display: flex;
    align-items: center;
    gap: 0.3em;
    font-weight: bold;
  }
  /* The selected mark before the name. */
  .tick {
    width: 0.8em;
    height: 0.7em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
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
