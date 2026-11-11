<!--
  Chat-style read-through. The only text on screen is the script.
  Lines appear as bubbles as they are read: your role's lines on the right, others on the left,
  each with the speaker's icon. The current line is the brightest bubble; on your line
  a tap anywhere advances. Earlier lines are a little dimmer.
  After the last line, the title and end mark show, then give way to the author's afterword
  for the post-game talk. The top band beside the UZU HUD shows both roles and the phase.
-->
<script lang="ts">
  import { currentLine } from '@uzu-toolkit/kit';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import { AFTERWORD, END_MARK, LINES, SPEAKER_NAMES, TITLE } from '../scenario';
  import { game, sendAction } from '../store.svelte';
  import TopBand from './TopBand.svelte';

  const dialogue = $derived(game.state?.dialogue);
  const myRole = $derived(game.me ? game.state?.roles[game.me] : undefined);
  const line = $derived(dialogue ? currentLine(LINES, dialogue) : null);
  const mine = $derived(!!line && line.speaker === myRole);
  const shown = $derived(dialogue ? LINES.slice(0, dialogue.index + 1) : []);

  let chat: HTMLOListElement | undefined = $state();
  // Keep the newest line in view as lines are added.
  $effect(() => {
    void shown.length;
    chat?.scrollTo({ top: chat.scrollHeight });
  });

  const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** A new line grows in from zero height, so the lines above slide up instead of jumping. */
  function grow(node: HTMLElement) {
    const height = node.offsetHeight;
    const margin = parseFloat(getComputedStyle(node).marginTop);
    const list = node.parentElement;
    return {
      duration: reduceMotion() ? 0 : 200,
      easing: cubicOut,
      css: (t: number) => `overflow: hidden; height: ${t * height}px; margin-top: ${t * margin}px; opacity: ${t};`,
      // Keep the newest line in view while it grows.
      tick: () => list?.scrollTo({ top: list.scrollHeight }),
    };
  }

  function advance(): void {
    if (mine && dialogue) sendAction('advance', { index: dialogue.index });
  }
</script>

<main data-mine={mine} onclick={advance} role="presentation">
  {#if dialogue}
    <TopBand {myRole} speaker={line?.speaker} finished={dialogue.finished} />
  {/if}
  {#if dialogue?.finished}
    <div class="end">
      <p class="closing">{TITLE}<br />{END_MARK}</p>
      <p class="afterword">{AFTERWORD}</p>
    </div>
  {:else}
    <ol class="chat" bind:this={chat} out:fade={{ duration: 300 }}>
      {#each shown as l, i}
        <li in:grow data-side={l.speaker === myRole ? 'right' : 'left'} data-current={i === dialogue?.index}>
          <img src={`./assets/icon-${l.speaker}.webp`} alt={SPEAKER_NAMES[l.speaker]} />
          <p>{l.text}</p>
        </li>
      {/each}
    </ol>
  {/if}
</main>

<style>
  /* Shippori Mincho (Google Fonts, OFL), subset to the script's characters. See CLAUDE.md. */
  @font-face {
    font-family: 'Shippori Mincho';
    src: url('../fonts/ShipporiMincho-Regular.subset.woff2') format('woff2');
    font-display: block;
  }
  :global(body) {
    margin: 0;
  }
  main {
    /* Neutral greys only, no tint. */
    --bg: #141414;
    --paper: #f5f5f5;
    --ink: #141414;
    --dim: #2b2b2b;
    position: fixed;
    inset: 0;
    box-sizing: border-box;
    /* One cell: the chat and the end screen overlap while one fades into the other. */
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    /* The HUD's bottom is measured from the safe area's top; the top band sits beside the HUD. */
    padding: calc(var(--safe-top, 0px) + var(--hud-y, 0px)) calc(var(--safe-right, 0px) + 0.8em)
      calc(var(--safe-bottom, 0px) + 0.8em) calc(var(--safe-left, 0px) + 0.8em);
    background: var(--bg);
    color: var(--paper);
    font-family: 'Shippori Mincho', serif;
    /* Sizes are in em; the base scales with the screen's short side. */
    font-size: clamp(14px, 4.4vmin, 28px);
    overflow: hidden;
    user-select: none;
  }
  main[data-mine='true'] {
    cursor: pointer;
  }
  main > :global(*) {
    grid-area: 1 / 1;
  }
  .chat {
    align-self: end;
    max-height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    /* Older lines scroll up; the list keeps the newest line in view. */
    overflow-y: auto;
    scrollbar-width: none;
  }
  li {
    display: flex;
    align-items: flex-end;
    gap: 0.45em;
    max-width: 90%;
    opacity: 0.6;
    transition: opacity 0.2s;
  }
  /* Spacing as a margin (not gap) so a new line's space grows in with it. */
  li + li {
    margin-top: 0.45em;
  }
  li[data-side='right'] {
    flex-direction: row-reverse;
    align-self: flex-end;
  }
  li[data-current='true'] {
    opacity: 1;
  }
  img {
    flex: none;
    width: 1.8em;
    height: 1.8em;
    border-radius: 50%;
    object-fit: cover;
  }
  li p {
    margin: 0;
    /* Keep bubbles tight: padding here costs a lot of room on a phone. */
    padding: 0.35em 0.7em;
    border-radius: 0.8em;
    background: var(--dim);
    transition:
      background-color 0.2s,
      color 0.2s;
  }
  /* Your own current line turns light: the cue to read and tap. */
  main[data-mine='true'] li[data-current='true'] p {
    background: var(--paper);
    color: var(--ink);
  }
  /* The end mark holds for a moment, then crossfades into the afterword. */
  .end {
    margin: auto;
    display: grid;
    place-items: center;
    text-align: center;
  }
  .end > p {
    grid-area: 1 / 1;
    margin: 0;
  }
  .closing {
    line-height: 2.4;
    animation:
      fade-in 0.4s 0.2s both,
      fade-out 1s 2.5s forwards;
  }
  .afterword {
    line-height: 2;
    /* If it wraps (portrait), break between phrases and keep the lines even. */
    word-break: auto-phrase;
    text-wrap: balance;
    animation: fade-in 1s 3.5s both;
  }
  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
