<!--
  The introduction with the cast (readyPhase()): optional story text, the game's flow, then your part in a block of its own, then the other
  parts as plain text (icon, name, one line on who they are). The next button sits in the footer;
  once you tap it, it keeps its name, turns outlined in a dark 2px edge with a tick and the band checks your
  icon; tapping it again takes it back.
  The phase ends when everyone is ready. On a landscape screen the text over the flow stands beside the cast.
-->
<script lang="ts">
  import type { Part, ReadyState } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import FooterActions from './FooterActions.svelte';
  import FlowStrip from './FlowStrip.svelte';
  import Guide from './Guide.svelte';
  import NextButton from './NextButton.svelte';
  import { sceneIn, sceneOut } from './motion';
  // UI strings by key.
  import STRINGS from '../strings';
  import { waitNote } from '../wait';

  let {
    state,
    me,
    part,
    parts,
    send,
    text,
    guide,
    cast,
  }: PhaseViewProps<ReadyState> & { text?: string; guide?: string; cast: readonly Part[] } = $props();

  const paragraphs = $derived(text ? text.split(/\n{2,}/) : []);
  const mine = $derived(cast.find((p) => p.id === part));
  const others = $derived(cast.filter((p) => p !== mine));
  const ready = $derived(state.ready.includes(me));
</script>

<div class="cast" in:sceneIn|global out:sceneOut|global>
  <div class="scroll body">
    {#if guide}<Guide text={guide} />{/if}
    <div class="side">
      {#if paragraphs.length}
        <div class="text">
          {#each paragraphs as p}<p>{p}</p>{/each}
        </div>
      {/if}
      <div class="flow"><FlowStrip /></div>
    </div>
    <div class="parts">
      {#if mine}
        <section class="mine">
          <img src={`./assets/icon-${mine.roles[0]}.webp`} alt="" />
          <h2>{STRINGS['cast.mine']}</h2>
          <span class="name">{mine.name}</span>
          {#if mine.description}<span class="about">{mine.description}</span>{/if}
        </section>
      {/if}
      {#if others.length}
        <section class="others">
          {#if mine}<h2>{STRINGS['cast.others']}</h2>{/if}
          <ul>
            {#each others as p (p.id)}
              <li>
                <img src={`./assets/icon-${p.roles[0]}.webp`} alt="" />
                <span class="name">{p.name}</span>
                {#if p.description}<span class="about">{p.description}</span>{/if}
              </li>
            {/each}
          </ul>
        </section>
      {/if}
    </div>
  </div>
</div>
<FooterActions>
  <NextButton on={ready} note={ready ? waitNote(Object.keys(parts).length - state.ready.length) : undefined} onclick={() => send(ready ? 'unready' : 'ready')}>
    {#if ready}<svg class="tick" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5l3.5 3.5L11 1.5" /></svg>{/if}{STRINGS['button.ready']}
  </NextButton>
</FooterActions>

<style>
  /* The guide, the text and the cast scroll together if they run long. */
  .cast {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    gap: 1em;
    justify-items: center;
  }
  .body {
    width: 100%;
    max-width: 30em;
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.2em;
  }
  /* The text and the flow: one block, so a wide screen stacks them beside the cast. */
  .side {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
  }
  .text {
    display: flex;
    flex-direction: column;
    gap: 0.8em;
  }
  p {
    margin: 0;
  }
  /* Story text, left-aligned. */
  .text p {
    line-height: 1.9;
    white-space: pre-line;
    word-break: auto-phrase;
  }
  .parts {
    display: flex;
    flex-direction: column;
    gap: 1em;
    font-family: var(--font-ui);
  }
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-size: max(16px, 0.8em);
    font-weight: 700;
  }
  /* Your part: one block of its own, tinted, so it reads as information and not as a choice. */
  .mine {
    display: grid;
    grid-template-columns: 3em 1fr;
    column-gap: 0.8em;
    align-items: center;
    padding: 0.8em 1em;
    border-radius: var(--radius-read);
    background: var(--color-bubble-mine);
  }
  .mine img {
    grid-row: 1 / span 3;
    width: 3em;
    height: 3em;
  }
  .mine h2 {
    color: var(--color-text);
  }
  .mine .name {
    font-size: 1.15em;
  }
  /* The other parts: plain text on the page, no block, nothing that looks tappable. */
  .others {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    display: grid;
    grid-template-columns: 1.8em 1fr;
    column-gap: 0.7em;
    align-items: start;
  }
  li img {
    grid-row: 1 / span 2;
    width: 1.8em;
    height: 1.8em;
  }
  .name {
    font-weight: bold;
  }
  .about {
    color: var(--color-text-quiet);
  }
  /* Ready: the button keeps its name, outlined in a dark 2px edge with a tick, so it reads as pressed. */
  .tick {
    width: 0.8em;
    height: 0.7em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  @media (orientation: landscape) {
    .body {
      max-width: 52em;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 2em;
    }
    /* The guide across both columns. */
    .body > :global(.guide) {
      grid-column: 1 / -1;
    }
  }
</style>
