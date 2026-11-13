<!--
  The band: its own row under the UZU HUD, or the HUD's row when the HUD is narrow (docs/design.md, Top band).
  Centre: the game's phase, in the quieter text colour; in a work of several phases a button that opens the phase list. Right: every player's part, name under
  icon, the others left and yours right as in the chat, yours marked with a double circle. A part
  that doubles roles shows its first role's icon; a check marks a player done with a phase
  everyone finishes on their own. It does not signal the turn; the advance button does.
-->
<script lang="ts">
  import type { Part } from '@uzu-toolkit/kit';
  import { fade } from 'svelte/transition';
  import { sceneIn, sceneOut } from './motion';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    parts,
    myPart,
    done = [],
    phase,
    onphase,
    phaseOpen = false,
  }: {
    parts: readonly Part[];
    myPart: string | undefined;
    done?: readonly string[];
    phase: string;
    /** Makes the phase a button that opens the phase list; leave out for a one-phase work. */
    onphase?: () => void;
    /** Whether what the phase button opens is showing. */
    phaseOpen?: boolean;
  } = $props();

  const shown = $derived(myPart ? [...parts.filter((p) => p.id !== myPart), ...parts.filter((p) => p.id === myPart)] : parts);
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
</script>

<header>
  <!-- With a way to open the phase list the phase is a pill with a down mark, so it reads as tappable. -->
  {#if onphase}
    <button type="button" class="phase" aria-expanded={phaseOpen} onclick={onphase}>
      {@render label()}
      <svg class="more" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
    </button>
  {:else}
    <div class="phase">{@render label()}</div>
  {/if}
  <div class="roles">
    {#each shown as part (part.id)}
      <span class="who">
        <span class="icon">
          <img src={`./assets/icon-${part.roles[0]}.webp`} alt="" data-you={part.id === myPart} />
          {#if done.includes(part.id)}
            <svg class="check" viewBox="0 0 16 16" aria-hidden="true" transition:fade={{ duration }}>
              <circle cx="8" cy="8" r="8" />
              <path d="M4.5 8.2l2.3 2.3 4.7-4.8" />
            </svg>
          {/if}
        </span>{part.name}
      </span>
    {/each}
  </div>
</header>

<!-- Like the screen under it: the old label fades out, then the new one fades in. -->
{#snippet label()}
  <span class="label">
    {#key phase}
      <span in:sceneIn out:sceneOut>{phase}</span>
    {/key}
  </span>
{/snippet}

<style>
  /*
   * Full width on its own background, under the HUD or beside it (--band-top, set in src/index.ts).
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
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    padding: 0.3em 0.8em;
    border: none;
    border-radius: 999px;
    background: none;
    color: var(--color-text-quiet);
    font: inherit;
    font-size: 18px;
  }
  button.phase {
    background: var(--color-bg);
    color: var(--color-text);
    cursor: pointer;
    pointer-events: auto;
  }
  /* The old and new phase share the cell, one fading out before the other fades in. */
  .label {
    display: grid;
  }
  .label > span {
    grid-area: 1 / 1;
  }
  .more {
    flex: none;
    width: 0.6em;
    height: 0.4em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  button.phase[aria-expanded='true'] .more {
    transform: scaleY(-1);
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
  .icon {
    position: relative;
    display: block;
    line-height: 0;
  }
  /* Done with a phase everyone finishes on their own: a check at the icon's lower right. */
  .check {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 16px;
    height: 16px;
  }
  .check circle {
    fill: var(--color-text);
  }
  .check path {
    fill: none;
    stroke: var(--color-bubble);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* Your role: a double circle (the icon's edge and a ring around it). */
  img[data-you='true'] {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
</style>
