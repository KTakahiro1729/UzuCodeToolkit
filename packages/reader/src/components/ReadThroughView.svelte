<!--
  The read-through phase's screen. In the work's last phase, the end of the read-through gives way
  to the end screen and the post-game screen, and the band says the post-game label once that
  screen comes in.
-->
<script lang="ts">
  import type { DialogueProgress } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import { type Script, scenario as scenarioOf } from '../script';
  import { band } from '../store.svelte';
  import Ending from './Ending.svelte';
  import ReadThrough from './ReadThrough.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { state, part, send, last, script }: PhaseViewProps<DialogueProgress> & { script: Script } = $props();

  const scenario = $derived(scenarioOf(script));
  // Back to the phase's own label whenever the post-game screen is not up (also after a reset).
  $effect(() => {
    if (!state.finished) band.label = null;
    return () => (band.label = null);
  });
</script>

{#if state.finished}
  <Ending {script} onreview={() => (band.label = STRINGS['phase.review'])} />
{:else}
  <ReadThrough {scenario} progress={state} myPart={part} final={last} onadvance={(index) => send('advance', { index })} />
{/if}
