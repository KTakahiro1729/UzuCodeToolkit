<!--
  The read-through phase's screen, as chat bubbles or, with `screen`, on UZU's stage layout. In the work's last phase, the end of the read-through gives way
  to the end screen and the post-game screen, and the band says the post-game label once that
  screen comes in.
-->
<script lang="ts">
  import type { DialogueProgress } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import type { ScreenLayout } from '../layout';
  import { type Script, scenario as scenarioOf } from '../script';
  import { band } from '../store.svelte';
  import Ending from './Ending.svelte';
  import ReadThrough from './ReadThrough.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let {
    state,
    part,
    send,
    last,
    script,
    screen = ReadThrough,
    layout,
  }: PhaseViewProps<DialogueProgress> & {
    script: Script;
    /**
     * The screen that shows the lines: chat bubbles by default, or `StageReadThrough` from
     * '@uzu-toolkit/reader/stage' (UZU's design guide layout). It lives behind an entry of its own so a
     * work that never uses it does not ship it.
     */
    screen?: typeof ReadThrough;
    /** The work's own layout definition for a screen laid out from one (`StageReadThrough`); the toolkit's when left out. */
    layout?: ScreenLayout;
  } = $props();

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
  {@const Screen = screen}
  <Screen {scenario} progress={state} myPart={part} final={last} onadvance={(index) => send('advance', { index })} {...layout ? { layout } : {}} />
{/if}
