<!--
  Chat-style read-through. The only text on screen is the script.
  Lines appear as bubbles as they are read: your role's lines on the right, others on the left,
  each with the speaker's icon. The current line is the brightest bubble; on your line
  a tap anywhere advances. Earlier lines fade back.
-->
<script lang="ts">
  import { currentLine } from '@uzu-toolkit/kit';
  import { END_MARK, LINES, SPEAKER_NAMES, TITLE } from '../scenario';
  import { game, sendAction } from '../store.svelte';

  const dialogue = $derived(game.state?.dialogue);
  const myRole = $derived(game.me ? game.state?.roles[game.me] : undefined);
  const line = $derived(dialogue ? currentLine(LINES, dialogue) : null);
  const mine = $derived(!!line && line.speaker === myRole);
  const shown = $derived(dialogue ? LINES.slice(0, dialogue.index + 1) : []);

  function advance(): void {
    if (mine && dialogue) sendAction('advance', { index: dialogue.index });
  }
</script>

<main data-mine={mine} onclick={advance} role="presentation">
  {#if dialogue?.finished}
    <p class="end">{TITLE}<br />{END_MARK}</p>
  {:else}
    <ol class="chat">
      {#each shown as l, i}
        <li data-side={l.speaker === myRole ? 'right' : 'left'} data-current={i === dialogue?.index}>
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
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: max(var(--hud-y, 0px), var(--safe-top, 0px)) calc(var(--safe-right, 0px) + 1.2em)
      calc(var(--safe-bottom, 0px) + 1.2em) calc(var(--safe-left, 0px) + 1.2em);
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
  .chat {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.7em;
    overflow: hidden;
    /* Older lines scroll off the top; fade them out instead of cutting them. */
    mask-image: linear-gradient(to bottom, transparent, #000 3em);
  }
  li {
    display: flex;
    align-items: flex-end;
    gap: 0.6em;
    max-width: 80%;
    opacity: 0.45;
    transition: opacity 0.2s;
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
    width: 2.2em;
    height: 2.2em;
    border-radius: 50%;
    object-fit: cover;
  }
  p {
    margin: 0;
    padding: 0.6em 0.9em;
    border-radius: 1em;
    background: var(--dim);
  }
  /* Your own current line turns light: the cue to read and tap. */
  main[data-mine='true'] li[data-current='true'] p {
    background: var(--paper);
    color: var(--ink);
  }
  .end {
    margin: auto;
    text-align: center;
    line-height: 2.4;
  }
</style>
