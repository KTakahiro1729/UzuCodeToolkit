<!--
  A work as a list of phases: the band and, under it, the current phase's screen. Changing phase
  fades the old screen out and the new one in (./motion.ts). Right after a phase that can be
  reopened, a secondary button beside the screen's main action sends everyone back to it
  (PhaseView.reopen).
  The footer holds the screen's main actions; in a work of more than one phase it also has
  read-back buttons: the phase list, and the content of phases already left that stays readable
  (PhaseView.keep, such as the handouts). Each opens as a sheet over the screen, for you alone,
  with the main actions still under it; a phase change closes it. On a screen wide enough for
  columns, the last kept phase stays in view beside the screen instead (Frame's aside), and its
  footer button is hidden there.
-->
<script lang="ts">
  import { phaseAction } from '@uzu-toolkit/kit';
  import type { FlowOptions } from '../flow';
  import { band, game, sendAction } from '../store.svelte';
  import Button from './Button.svelte';
  import Frame from './Frame.svelte';
  import FooterActions from './FooterActions.svelte';
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
  // The footer's read-back entries: each kept phase the game has left. The phase list opens from the band.
  const kept = $derived(phases.slice(0, at).filter((p) => p.keep && game.state?.phases[p.id]));
  // What stays beside the screen on a wide screen: the last kept phase.
  const side = $derived(kept.at(-1));
  let open = $state<string | null>(null);
  const sheet = $derived(open === FLOW ? null : kept.find((p) => p.id === open));
  $effect(() => {
    // Close the sheet when the phase changes.
    void at;
    open = null;
  });
  // Parts whose players are done with the current phase, for the band's checks.
  const doneParts = $derived(
    phase?.done && game.state ? phase.done(game.state.phases[phase.id]).map((seat) => game.state!.parts[seat]) : [],
  );
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
  <Frame {parts} {myPart} done={doneParts} phase={band.label ?? phase.label} nav={kept.length ? nav : undefined} onphase={phases.length > 1 ? () => toggle(FLOW) : undefined} phaseOpen={open === FLOW} aside={side?.keep ? aside : undefined}>
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
      <FooterActions place="aside">
        <Button variant="secondary" onclick={() => sendAction(phaseAction(reopen.id, 'reopen'), {})}>
          {reopen.reopen?.label}
        </Button>
      </FooterActions>
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

{#snippet aside()}
  {#if side?.keep}<side.keep.view {...propsFor(side)} send={() => {}} last={false} />{/if}
{/snippet}

{#snippet nav()}
  {#each kept as p (p.id)}
    <button type="button" class="tab" data-aside={p === side ? '' : undefined} aria-pressed={open === p.id} onclick={() => toggle(p.id)}>{p.keep?.label}</button>
  {/each}
{/snippet}

<style>
  /*
   * Read-back buttons: plain text on the footer, quieter than its actions; the open one in bold
   * and underlined, as a chosen tab.
   */
  .tab {
    margin: 0;
    padding: 0.45em 0.6em;
    border: none;
    background: none;
    color: var(--color-text-quiet);
    font: inherit;
    font-family: var(--font-ui);
    font-size: max(16px, 0.85em);
    cursor: pointer;
  }
  .tab[aria-pressed='true'] {
    color: var(--color-text);
    font-weight: 700;
    text-decoration: underline;
    text-underline-offset: 0.3em;
  }
</style>
