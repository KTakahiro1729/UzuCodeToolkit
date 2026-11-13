<!--
  The screen of a timed phase (timedPhase()): text to read, an optional guide at its top, and the
  time left in the footer's leftmost item with pause and more time after it. The main button
  depends on the phase's rule: none for a phase that ends by its time alone; "done" (a toggle,
  with how many are still needed) when everyone must say so; "next" when anyone may
  end it, or only one part (the others see who). The text is the work's own: `text` and `guide`.
-->
<script lang="ts">
  import { secondsLeft, stillNeeded, type TimedState } from '@uzu-toolkit/kit';
  import { gameTime } from '@uzuhq/code-sdk';
  import type { PhaseViewProps } from '../flow';
  import { fill } from '../fill';
  import Guide from './Guide.svelte';
  import NextButton from './NextButton.svelte';
  import Slot from './Slot.svelte';
  import TransitionFooter from './TransitionFooter.svelte';
  import { sceneIn, sceneOut } from './motion';
  // UI strings by key.
  import STRINGS from '../strings';

  // `state` is renamed: the name clashes with the $state rune.
  let {
    state: phase,
    me,
    part,
    names,
    send,
    text,
    guide,
  }: PhaseViewProps<TimedState> & { text?: string; guide?: string } = $props();

  // Seconds left, from the game clock; while paused it stands at the moment of the pause.
  let left = $state(0);
  $effect(() => {
    const tick = () => (left = secondsLeft(phase.endsAt, phase.pausedAt ?? gameTime()));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  });

  const paragraphs = $derived(text ? text.split(/\n{2,}/) : []);
  const rule = $derived(phase.rule);
  const said = $derived(phase.said.includes(me));
  /** Only one part may move on: the others see who. */
  const only = $derived(rule !== null && typeof rule === 'object' ? rule.only : undefined);
  const blocked = $derived(only !== undefined && part !== only);
  /** A toggle ("done") when several must say so; a plain next button when one may end it. */
  const toggle = $derived(rule === 'everyone');
  const more = $derived(rule === null ? 0 : stillNeeded(rule, phase.seats.length, phase.said.length));
  const note = $derived(
    blocked
      ? fill(STRINGS['status.facilitator'], { name: names[only ?? ''] ?? '' })
      : toggle
        ? said && more > 0
          ? fill(STRINGS['status.needMore'], { n: more })
          : undefined
        : rule === 'anyone'
          ? STRINGS['status.anyoneNext']
          : undefined,
  );
</script>

<div class="screen" in:sceneIn|global out:sceneOut|global>
  <div class="timed" data-uzu-part="timed">
    <div class="scroll text">
      {#if guide}<Guide text={guide} />{/if}
      {#each paragraphs as p}<p>{p}</p>{/each}
    </div>
  </div>
</div>
<TransitionFooter {left} paused={!!phase.pausedAt} onpause={() => send('pause')} onresume={() => send('resume')}>
  {#snippet extras()}
    <Slot icon="plus" onclick={() => send('extend')}>{STRINGS['handout.extend']}</Slot>
  {/snippet}
  {#if rule !== null}
    <NextButton
      on={toggle ? said : undefined}
      disabled={blocked}
      {note}
      onclick={() => (toggle ? send(said ? 'undone' : 'done') : send('done'))}
    >
      <span class="label">{#if toggle && said}<svg class="tick" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5l3.5 3.5L11 1.5" /></svg>{/if}{toggle ? STRINGS['button.done'] : STRINGS['button.nextPhase']}</span>
    </NextButton>
  {/if}
</TransitionFooter>

<style>
  .screen {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  /* The guide and the text, centred, at the chat's reading width; they scroll together if long. */
  .timed {
    align-self: center;
    justify-self: center;
    width: 100%;
    max-width: 30em;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
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
  .label {
    display: inline-flex;
    align-items: center;
    gap: 0.3em;
  }
  .tick {
    width: 0.8em;
    height: 0.7em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
