<!--
  The screen of a phase with no game of its own (emptyPhase()): optional story text, such as an
  introduction, and the next button in the footer, which every player can tap. Without text it is
  a placeholder for a phase not made yet. The band's label names the phase. An optional guide
  (what to do now) opens the text and scrolls with it.
-->
<script lang="ts">
  import type { PhaseViewProps } from '../flow';
  import FlowStrip from './FlowStrip.svelte';
  import Guide from './Guide.svelte';
  import { sceneIn, sceneOut } from './motion';
  import FooterActions from './FooterActions.svelte';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let { send, text, guide, last }: PhaseViewProps<{ next: boolean }> & { text?: string; guide?: string } = $props();
  // Paragraphs are separated by a blank line.
  const paragraphs = $derived(text ? text.split(/\n{2,}/) : []);
</script>

<div class="screen" in:sceneIn|global out:sceneOut|global>
  <div class="empty">
    <div class="scroll text">
      {#if guide}<Guide text={guide} />{/if}
      {#each paragraphs as p}<p>{p}</p>{/each}
      <FlowStrip />
    </div>
  </div>
</div>
<FooterActions>
  <NextButton onclick={() => send('next')}>{STRINGS[last ? 'button.end' : 'button.nextAll']}</NextButton>
</FooterActions>

<style>
  .screen {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  /* The guide and the text, centred; they scroll together if long. */
  .empty {
    align-self: center;
    justify-self: center;
    width: 100%;
    /* The same reading width as the chat. */
    max-width: 30em;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  /* The guide and the story text: left-aligned so every line starts at one edge; they scroll together if long. */
  .text {
    min-height: 0;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.8em;
  }
  p {
    margin: 0;
    line-height: 1.9;
    white-space: pre-line;
    word-break: auto-phrase;
  }
</style>
