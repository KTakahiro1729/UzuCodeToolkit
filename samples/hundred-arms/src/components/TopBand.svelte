<!--
  The band beside the UZU HUD, at the HUD's height (docs/design.md, Top band).
  Left: the game's phase, in the quieter text colour. Right: both roles as icon and name, the other
  left and yours right as in the chat, yours marked with a double circle. It does not signal the turn; the current
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
  <div class="roles">
    {#each roles as role (role)}
      <span class="who">
        <img src={`./assets/icon-${role}.webp`} alt="" data-you={role === myRole} />{SPEAKER_NAMES[role]}
      </span>
    {/each}
  </div>
</header>

<style>
  /*
   * Spans the screen's width at the HUD's height. Three columns: the HUD's side, the phase
   * centred on the screen, the roles at the right.
   */
  header {
    position: fixed;
    top: var(--safe-top, 0px);
    left: calc(var(--safe-left, 0px) + var(--hud-x, 0px));
    right: calc(var(--safe-right, 0px) + 0.8em);
    height: var(--hud-y, 0px);
    /* Centre on the screen, not on the band: mirror the HUD's width on the left. */
    margin-left: calc(-1 * var(--hud-x, 0px));
    padding-left: var(--hud-x, 0px);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    white-space: nowrap;
    font-family: var(--font-ui);
    font-weight: 700;
    /* One size for the band, the minimum for text, so icon, ring and name fit at the HUD's height. */
    font-size: 16px;
    pointer-events: none;
  }
  .phase {
    grid-column: 2;
    display: grid;
    color: var(--color-text-quiet);
  }
  /* The old and new phase overlap while one fades into the other. */
  .phase > span {
    grid-area: 1 / 1;
  }
  .roles {
    grid-column: 3;
    justify-self: end;
    display: flex;
    gap: 0.8em;
  }
  /* Icon above, name below. */
  .who {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    line-height: 1;
  }
  img {
    /* Sized from the HUD's height so icon, ring and name fit in the band. */
    width: calc(var(--hud-y, 48px) - 32px);
    height: calc(var(--hud-y, 48px) - 32px);
    border-radius: 50%;
    object-fit: cover;
  }
  /* Your role: a double circle (the icon's edge and a ring around it). */
  img[data-you='true'] {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
</style>
