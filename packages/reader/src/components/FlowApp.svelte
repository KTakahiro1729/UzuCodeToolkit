<!--
  A work as a list of phases: the band and, under it, the current phase's screen. Changing phase
  fades the old screen out and the new one in (./motion.ts). Right after a phase that can be
  reopened, a quiet button at the bottom left sends everyone back to it (PhaseView.reopen).
-->
<script lang="ts">
  import { phaseAction } from '@uzu-toolkit/kit';
  import type { FlowOptions } from '../flow';
  import { band, game, sendAction } from '../store.svelte';
  import Frame from './Frame.svelte';

  let { parts, phases }: Pick<FlowOptions, 'parts' | 'phases'> = $props();

  const at = $derived(game.state?.at ?? 0);
  const phase = $derived(phases[at]);
  const names = $derived(Object.fromEntries(parts.map((p) => [p.id, p.name])));
  const myPart = $derived(game.me ? game.state?.parts[game.me] : undefined);
  const back = $derived(at > 0 ? phases[at - 1] : undefined);
  const reopen = $derived(
    back?.reopen && game.state?.reopenable && back.reopen.when(game.state.phases[back.id]) ? back : undefined,
  );
</script>

{#if game.state && game.me && phase}
  <Frame {parts} {myPart} phase={band.label ?? phase.label}>
    {#key phase.id}
      <phase.view
        {...phase.props}
        state={game.state.phases[phase.id]}
        me={game.me}
        part={myPart}
        parts={game.state.parts}
        {names}
        send={(name: string, payload: Record<string, unknown> = {}) => sendAction(phaseAction(phase.id, name), payload)}
        last={at === phases.length - 1}
      />
    {/key}
    {#if reopen}
      <button type="button" class="reopen" onclick={() => sendAction(phaseAction(reopen.id, 'reopen'), {})}>
        {reopen.reopen?.label}
      </button>
    {/if}
  </Frame>
{/if}

<style>
  /* Not the next step, so white rather than filled, and in the corner away from the screen's focus. */
  .reopen {
    align-self: end;
    justify-self: start;
    margin: 0;
    padding: 0.45em 0.8em;
    border: none;
    border-radius: 999px;
    background: var(--color-bubble);
    color: var(--color-text);
    font: inherit;
    font-family: var(--font-ui);
    cursor: pointer;
  }
</style>
