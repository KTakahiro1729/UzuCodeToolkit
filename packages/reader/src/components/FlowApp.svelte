<!--
  A work as a list of phases: the band and, under it, the current phase's screen. Changing phase
  fades the old screen out and the new one in (./motion.ts).
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
  </Frame>
{/if}
