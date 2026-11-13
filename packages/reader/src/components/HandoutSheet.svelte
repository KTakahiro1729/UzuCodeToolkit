<!--
  The handout read again after its phase, from the footer: the same tabs, the settings showing
  what was filled in. Nothing here changes the game. `ownLabel` names the part's own tab in place
  of the part's name (the post-game screen, where the part is already chosen above).
-->
<script lang="ts">
  import { type Handout, type HandoutState, settingsOf } from '@uzu-toolkit/kit';
  import type { PhaseViewProps } from '../flow';
  import HandoutTabs from './HandoutTabs.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    state: phase,
    part,
    names,
    handout,
    ownLabel,
    guide,
    memory,
  }: Pick<PhaseViewProps<HandoutState>, 'state' | 'part' | 'names'> & { handout: Handout; ownLabel?: string; guide?: string; memory?: string } = $props();
</script>

<HandoutTabs {handout} {part} {guide} {memory} partName={ownLabel ?? names[part] ?? ''}>
  {#snippet fields()}
    <dl>
      {#each settingsOf(handout, part) as f (f.id)}
        {@const v = phase.values[part]?.[f.id]?.trim()}
        <div>
          <dt>{f.label}</dt>
          <dd class:blank={!v}>{v || STRINGS['handout.blank']}</dd>
        </div>
      {/each}
    </dl>
  {/snippet}
</HandoutTabs>

<style>
  /* Each setting: its name, what was filled in under it. */
  dl {
    margin: 0;
    display: grid;
    gap: 0.8em;
    font-family: var(--font-ui);
  }
  div {
    display: grid;
    gap: 0.3em;
    line-height: 1.5;
  }
  dt {
    color: var(--color-text-quiet);
  }
  dd {
    margin: 0;
  }
  .blank {
    color: var(--color-text-quiet);
  }
</style>
