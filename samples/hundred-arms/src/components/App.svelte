<!--
  Chat-style read-through. The only text on screen is the script.
  Lines appear as bubbles as they are read: your role's lines on the right in blue,
  others on the left in white, each with the speaker's icon. When the newest line is
  yours, a tap anywhere advances.
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

  let chat: HTMLOListElement | undefined = $state();
  // Keep the newest line in view as lines are added.
  $effect(() => {
    void shown.length;
    chat?.scrollTo({ top: chat.scrollHeight });
  });

  function advance(): void {
    if (mine && dialogue) sendAction('advance', { index: dialogue.index });
  }
</script>

<main data-mine={mine} onclick={advance} role="presentation">
  {#if dialogue?.finished}
    <p class="end">{TITLE}<br />{END_MARK}</p>
  {:else}
    <ol class="chat" bind:this={chat}>
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
    position: fixed;
    inset: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    padding: max(var(--hud-y, 0px), var(--safe-top, 0px)) calc(var(--safe-right, 0px) + 0.8em)
      calc(var(--safe-bottom, 0px) + 0.8em) calc(var(--safe-left, 0px) + 0.8em);
    background: var(--color-bg);
    color: var(--color-text);
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
    gap: 0.45em;
    /* Older lines scroll up; the list keeps the newest line in view. */
    overflow-y: auto;
    scrollbar-width: none;
  }
  li {
    display: flex;
    align-items: flex-end;
    gap: 0.45em;
    max-width: 90%;
  }
  li[data-side='right'] {
    flex-direction: row-reverse;
    align-self: flex-end;
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
    background: var(--color-bubble);
    color: var(--color-text-read);
    transition: background 0.2s, color 0.2s;
  }
  li[data-current='true'] p {
    background: var(--color-bubble-current);
    color: var(--color-bubble-text);
  }
  /* Your lines, as in any chat app. When the newest line is yours, it is your turn. */
  li[data-side='right'] p {
    background: var(--color-mine);
    color: var(--color-mine-text);
  }
  .end {
    margin: auto;
    text-align: center;
    line-height: 2.4;
  }
</style>
