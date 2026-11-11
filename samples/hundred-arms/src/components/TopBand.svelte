<!--
  The band beside the UZU HUD, at the HUD's height (docs/design.md, Top band).
  Left: the game's phase, in the quieter text colour. Right: both roles as icon and name, the other
  left and yours right as in the chat, yours marked as you. It does not signal the turn; the current
  line does.
-->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { ROLE_IDS, SPEAKER_NAMES } from '../scenario';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { myRole, finished }: { myRole: string | undefined; finished: boolean } = $props();

  const roles = $derived(myRole ? [...ROLE_IDS.filter((r) => r !== myRole), myRole] : ROLE_IDS);
  const phase = $derived(STRINGS[finished ? 'phase.review' : 'phase.reading']);
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
</script>

<header>
  <div class="phase">
    {#key phase}
      <span transition:fade={{ duration }}>{phase}</span>
    {/key}
  </div>
  {#each roles as role (role)}
    <span class="who">
      <img src={`./assets/icon-${role}.webp`} alt="" />{SPEAKER_NAMES[role]}
      {#if role === myRole}<span class="you">{STRINGS['band.you']}</span>{/if}
    </span>
  {/each}
</header>

<style>
  header {
    position: fixed;
    top: var(--safe-top, 0px);
    left: calc(var(--safe-left, 0px) + var(--hud-x, 0px) + 0.6em);
    right: calc(var(--safe-right, 0px) + 0.8em);
    height: var(--hud-y, 0px);
    display: flex;
    align-items: center;
    gap: 0.9em;
    white-space: nowrap;
    pointer-events: none;
  }
  .phase {
    margin-right: auto;
    display: grid;
    color: var(--color-text-quiet);
  }
  /* The old and new phase overlap while one fades into the other. */
  .phase > span {
    grid-area: 1 / 1;
  }
  .who {
    display: flex;
    align-items: center;
    gap: 0.4em;
  }
  img {
    width: 1.5em;
    height: 1.5em;
    border-radius: 50%;
    object-fit: cover;
  }
  .you {
    color: var(--color-text-quiet);
  }
</style>
