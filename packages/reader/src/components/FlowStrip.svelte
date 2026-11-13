<!--
  The game's flow shown inside a screen, under its content and scrolling with it: a quiet
  heading (the same words as the footer's list) and the phase list. Shown only in a work of more
  than one phase. Reading only, like the list itself.
-->
<script lang="ts">
  import { useFlow } from '../flowContext';
  import PhaseList from './PhaseList.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  const flow = useFlow();
  const info = $derived(flow?.());
</script>

{#if info && info.phases.length > 1}
  <section>
    <h2>{STRINGS['footer.flow']}</h2>
    <PhaseList phases={info.phases} at={info.at} ended={info.ended} inline />
  </section>
{/if}

<style>
  section {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    font-family: var(--font-ui);
  }
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-size: max(16px, 0.8em);
    font-weight: 700;
  }
</style>
