<!--
  A work as a list of phases: the band and, under it, the current phase's screen. Changing phase
  fades the old screen out and the new one in (./motion.ts). Right after a phase that can be
  reopened, a quiet button at the bottom left sends everyone back to it (PhaseView.reopen).
  A work of more than one phase has a footer: the phase list, and the content of phases already
  left that stays readable (PhaseView.keep, such as the handouts). Each opens as a sheet over
  the screen, for you alone; a phase change closes it, so the new screen is never missed.
-->
<script lang="ts">
  import { phaseAction } from '@uzu-toolkit/kit';
  import type { FlowOptions } from '../flow';
  import { band, game, sendAction } from '../store.svelte';
  import Frame from './Frame.svelte';
  import { sceneIn, sceneOut } from './motion';
  import PhaseList from './PhaseList.svelte';
  import Sheet from './Sheet.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { parts, phases }: Pick<FlowOptions, 'parts' | 'phases'> = $props();

  const at = $derived(game.state?.at ?? 0);
  const phase = $derived(phases[at]);
  const names = $derived(Object.fromEntries(parts.map((p) => [p.id, p.name])));
  const myPart = $derived(game.me ? game.state?.parts[game.me] : undefined);
  const back = $derived(at > 0 ? phases[at - 1] : undefined);
  const reopen = $derived(
    back?.reopen && game.state?.reopenable && back.reopen.when(game.state.phases[back.id]) ? back : undefined,
  );
  // The footer's entries: the phase list, then each kept phase the game has left.
  const kept = $derived(phases.slice(0, at).filter((p) => p.keep && game.state?.phases[p.id]));
  let open = $state<string | null>(null);
  const sheet = $derived(open === FLOW ? null : kept.find((p) => p.id === open));
  $effect(() => {
    // Close the sheet when the phase changes.
    void at;
    open = null;
  });
  const toggle = (id: string) => (open = open === id ? null : id);
  const propsFor = (p: (typeof phases)[number]) => ({
    ...p.props,
    state: game.state!.phases[p.id],
    me: game.me!,
    part: myPart,
    parts: game.state!.parts,
    names,
  });
</script>

<script lang="ts" module>
  /** The sheet ID of the phase list; the others are phase IDs. */
  const FLOW = ':flow';
</script>

{#if game.state && game.me && phase}
  <Frame {parts} {myPart} phase={band.label ?? phase.label} footer={phases.length > 1 ? footer : undefined}>
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
      <button type="button" class="reopen" in:sceneIn|global out:sceneOut|global onclick={() => sendAction(phaseAction(reopen.id, 'reopen'), {})}>
        {reopen.reopen?.label}
      </button>
    {/if}
    {#if open === FLOW}
      <Sheet title={STRINGS['footer.flow']} onclose={() => (open = null)}>
        <PhaseList {phases} {at} ended={game.state.ended} />
      </Sheet>
    {:else if sheet?.keep}
      <Sheet title={sheet.keep.label} onclose={() => (open = null)}>
        <sheet.keep.view {...propsFor(sheet)} send={() => {}} last={false} />
      </Sheet>
    {/if}
  </Frame>
{/if}

{#snippet footer()}
  <button type="button" class="tab" aria-pressed={open === FLOW} onclick={() => toggle(FLOW)}>{STRINGS['footer.flow']}</button>
  {#each kept as p (p.id)}
    <button type="button" class="tab" aria-pressed={open === p.id} onclick={() => toggle(p.id)}>{p.keep?.label}</button>
  {/each}
{/snippet}

<style>
  /* The footer's buttons: text on the white row; the open one on the page colour, in bold. */
  .tab {
    margin: 0;
    padding: 0.45em 0.9em;
    border: none;
    border-radius: 999px;
    background: none;
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
  .tab[aria-pressed='true'] {
    background: var(--color-bg);
    font-weight: 700;
  }
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
