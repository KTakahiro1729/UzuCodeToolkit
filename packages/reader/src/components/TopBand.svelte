<!--
  The band: its own row under the UZU HUD, or the HUD's row when the HUD is narrow (docs/design.md, Top band).
  Centre: the game's phase, in the quieter text colour. Right: every player's part, name under
  icon, the others left and yours right as in the chat, yours marked with a double circle. A part
  that doubles roles shows its first role's icon. It does not signal the turn; the advance button does.
-->
<script lang="ts">
  import { fade } from 'svelte/transition';
  import { getScenario } from '../store.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { myPart, finished }: { myPart: string | undefined; finished: boolean } = $props();

  const { parts } = getScenario();
  const shown = $derived(myPart ? [...parts.filter((p) => p.id !== myPart), ...parts.filter((p) => p.id === myPart)] : parts);
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
    {#each shown as part (part.id)}
      <span class="who">
        <img src={`./assets/icon-${part.roles[0]}.webp`} alt="" data-you={part.id === myPart} />{part.name}
      </span>
    {/each}
  </div>
</header>

<style>
  /*
   * Full width on its own background, under the HUD or beside it (--band-top, set in main.ts).
   * Three columns: empty (the HUD's side), the phase centred on the screen, the roles at the right.
   */
  header {
    position: fixed;
    /* The white reaches the top edge; the HUD sits on it. */
    top: 0;
    left: 0;
    right: 0;
    height: var(--band-bottom);
    box-sizing: border-box;
    /* More room at the right than the left, so the roles do not crowd the screen edge. */
    padding: calc(var(--safe-top, 0px) + var(--band-top, 0px)) calc(var(--safe-right, 0px) + 1.5em) 0
      calc(var(--safe-left, 0px) + 0.8em);
    display: grid;
    /* The phase is centred while the players fit in the right half; with more players it gives
       way to the left, keeping a gap, instead of running into them. */
    grid-template-columns: minmax(0, 1fr) auto minmax(max-content, 1fr);
    column-gap: 1em;
    align-items: center;
    background: var(--color-bubble);
    white-space: nowrap;
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 16px;
    pointer-events: none;
  }
  .phase {
    grid-column: 2;
    display: grid;
    color: var(--color-text-quiet);
    font-size: 18px;
  }
  /* The old and new phase overlap while one fades into the other. */
  .phase > span {
    grid-area: 1 / 1;
  }
  .roles {
    grid-column: 3;
    justify-self: end;
    display: flex;
    gap: 12px;
  }
  /* Icon above, name below. */
  .who {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    line-height: 1;
  }
  img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
  }
  /* Your role: a double circle (the icon's edge and a ring around it). */
  img[data-you='true'] {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
</style>
