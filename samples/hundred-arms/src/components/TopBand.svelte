<!--
  The band beside the UZU HUD, at the HUD's height. The other role sits on the left and
  yours on the right, as in the chat; the game's phase sits between them.
-->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { ROLE_IDS, SPEAKER_NAMES } from '../scenario';
  // UI strings by key. The values are the owner's words for the band, quoted verbatim.
  import STRINGS from '../strings.json';

  let { myRole, finished }: { myRole: string | undefined; finished: boolean } = $props();

  const other = $derived(ROLE_IDS.find((r) => r !== myRole) ?? ROLE_IDS[0]);
  const right = $derived(myRole ?? ROLE_IDS[1]);
  const phase = $derived(STRINGS[finished ? 'phase.review' : 'phase.reading']);
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 250;
</script>

<header>
  {#each [other, right] as role (role)}
    <span class="who" data-side={role === right ? 'right' : 'left'}>
      <img src={`./assets/icon-${role}.webp`} alt="" />{SPEAKER_NAMES[role]}
    </span>
  {/each}
  <div class="phase">
    {#key phase}
      <span transition:fade={{ duration }}>{phase}</span>
    {/key}
  </div>
</header>

<style>
  header {
    position: fixed;
    top: var(--safe-top, 0px);
    left: calc(var(--safe-left, 0px) + var(--hud-x, 0px) + 0.8em);
    right: calc(var(--safe-right, 0px) + 0.8em);
    height: var(--hud-y, 0px);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.6em;
    white-space: nowrap;
    pointer-events: none;
  }
  .who {
    grid-row: 1;
    display: flex;
    align-items: center;
    gap: 0.45em;
  }
  .who[data-side='left'] {
    grid-column: 1;
  }
  .who[data-side='right'] {
    grid-column: 3;
    flex-direction: row-reverse;
  }
  .phase {
    grid-row: 1;
    grid-column: 2;
    display: grid;
  }
  /* The old and new phase overlap while one fades into the other. */
  .phase > span {
    grid-area: 1 / 1;
  }
  img {
    width: 1.8em;
    height: 1.8em;
    border-radius: 50%;
    object-fit: cover;
  }
</style>
