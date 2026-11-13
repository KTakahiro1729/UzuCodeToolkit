<!--
  The introduction with the cast (readyPhase()): optional story text, then whom you play and every
  part (icon, name, one line on who they are), yours first and tinted. The next button sits in the footer;
  once you tap it, it keeps its name, turns red-outlined with a tick and the band checks your
  icon; tapping it again takes it back.
  The phase ends when everyone is ready. On a landscape screen the text and the cast stand side by side.
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

  let {
    state,
    me,
    part,
    send,
    text,
    guide,
    cast,
  }: PhaseViewProps<ReadyState> & { text?: string; guide?: string; cast: readonly Part[] } = $props();

  const paragraphs = $derived(text ? text.split(/\n{2,}/) : []);
  const mine = $derived(cast.find((p) => p.id === part));
  const shown = $derived(mine ? [mine, ...cast.filter((p) => p !== mine)] : cast);
  const ready = $derived(state.ready.includes(me));
  // The sentence around the name, so the name can be bold.
  const [before, after] = STRINGS['cast.you'].split('{name}');
</script>

<div class="cast" in:sceneIn|global out:sceneOut|global>
  <div class="scroll body">
    {#if guide}<Guide text={guide} />{/if}
    {#if paragraphs.length}
      <div class="text">
        {#each paragraphs as p}<p>{p}</p>{/each}
      </div>
    {/if}
    <div class="parts">
      {#if mine}<p class="you">{before}<strong>{mine.name}</strong>{after}</p>{/if}
      <ul>
        {#each shown as p (p.id)}
          <li class:mine={p === mine}>
            <img src={`./assets/icon-${p.roles[0]}.webp`} alt="" />
            <span class="name">{p.name}</span>
            {#if p.description}<span class="about">{p.description}</span>{/if}
          </li>
        {/each}
      </ul>
    </div>
    <div class="flow"><FlowStrip /></div>
  </div>
</div>
<FooterActions>
  <NextButton on={ready} onclick={() => send(ready ? 'unready' : 'ready')}>
    {#if ready}<svg class="tick" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5l3.5 3.5L11 1.5" /></svg>{/if}{STRINGS['button.next']}
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
    gap: 0.6em;
    font-family: var(--font-ui);
  }
  ul {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Icon on the left; name over the line on who they are. */
  li {
    display: grid;
    grid-template-columns: 2.6em 1fr;
    grid-template-rows: auto auto;
    column-gap: 0.8em;
    align-items: center;
    padding: 0.6em 0.9em;
    border-radius: var(--radius-read);
    background: var(--color-bubble);
  }
  li.mine {
    background: var(--color-bubble-mine);
  }
  img {
    grid-row: 1 / span 2;
    width: 2.6em;
    height: 2.6em;
  }
  .name {
    font-weight: bold;
  }
  .about {
    color: var(--color-text-quiet);
  }
  /* Ready: the button keeps its name, red-outlined with a tick, so it reads as pressed. */
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
    /* Low screens: tighter blocks, so the three parts fit beside the text. */
    li {
      padding: 0.3em 0.9em;
    }
    ul {
      gap: 0.4em;
    }
    .body {
      max-width: 52em;
      display: grid;
      grid-template-columns: 1fr 1fr;
      align-items: start;
      gap: 2em;
    }
    /* The guide across both columns. */
    .body > :global(.guide),
    .flow {
      grid-column: 1 / -1;
    }
  }
</style>
