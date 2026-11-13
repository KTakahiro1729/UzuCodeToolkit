<!--
  The screen of a phase with no game of its own (emptyPhase()): optional story text, such as an
  introduction, and under it the next button, which every player can tap. Without text it is a
  placeholder for a phase not made yet. The band's label names the phase.
-->
<script lang="ts">
  import type { PhaseViewProps } from '../flow';
  import { sceneIn, sceneOut } from './motion';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { send, text }: PhaseViewProps<{ next: boolean }> & { text?: string } = $props();
  // Paragraphs are separated by a blank line.
  const paragraphs = $derived(text ? text.split(/\n{2,}/) : []);
</script>

<div class="empty" in:sceneIn|global out:sceneOut|global>
  {#if paragraphs.length}
    <div class="text">
      {#each paragraphs as p}<p>{p}</p>{/each}
    </div>
  {/if}
  <NextButton onclick={() => send('next')}>{STRINGS['button.next']}</NextButton>
</div>

<style>
  /* The text and the button under it, centred as one; the button alone without text. */
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
  /* Story text: left-aligned so every line starts at one edge; scrolls if it is long. */
  .text {
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
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
