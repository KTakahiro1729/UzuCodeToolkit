<!--
  The screen of a phase whose content is not made yet (emptyPhase()): a next button alone, which
  every player can tap. The band's label names the phase. Lets a work lay out its whole order of
  phases before each one is built.
-->
<script lang="ts">
  import type { PhaseViewProps } from '../flow';
  import { sceneIn, sceneOut } from './motion';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { send }: PhaseViewProps<{ next: boolean }> = $props();
</script>

<div class="empty" in:sceneIn|global out:sceneOut|global>
  <NextButton onclick={() => send('next')}>{STRINGS['button.next']}</NextButton>
</div>

<style>
  /* The button alone, centred: it stands for the whole screen. */
  .empty {
    display: grid;
    place-items: center;
  }
</style>
