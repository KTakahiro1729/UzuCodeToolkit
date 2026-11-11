<!--
  Chat-style read-through.
  Lines appear as bubbles as they are read: your role's lines on the right, others on the left,
  each with the speaker's icon and name. Right under the newest line, both players see the
  advance button: active for whoever reads now, greyed for the other.
  After the last line, the title and end mark show, then give way to the author's afterword
  for the post-game talk. The top band beside the UZU HUD shows both roles and the phase.
-->
<script lang="ts">
  import { currentLine } from '@uzu-toolkit/kit';
  import { fade } from 'svelte/transition';
  import { AFTERWORD, END_MARK, LINES, SPEAKER_NAMES, TITLE } from '../scenario';
  import { game, sendAction } from '../store.svelte';
  import TopBand from './TopBand.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  const dialogue = $derived(game.state?.dialogue);
  const myRole = $derived(game.me ? game.state?.roles[game.me] : undefined);
  const line = $derived(dialogue ? currentLine(LINES, dialogue) : null);
  const mine = $derived(!!line && line.speaker === myRole);
  // The button says what it does until your first line is read; after that the mark alone.
  const labelled = $derived(!!dialogue && dialogue.index <= LINES.findIndex((l) => l.speaker === myRole));

  // The afterword replaces the title and end mark after a moment (CSS, 3 s); the band's phase
  // changes at the same moment, so the band never says something the screen does not show yet.
  let review = $state(false);
  $effect(() => {
    if (!dialogue?.finished) return void (review = false);
    const t = setTimeout(() => (review = true), 3000);
    return () => clearTimeout(t);
  });
  const shown = $derived(dialogue ? LINES.slice(0, dialogue.index + 1) : []);

  let chat: HTMLOListElement | undefined = $state();
  // Set by push(), which scrolls before it moves the lines; scrolling again mid-push would
  // follow the moving lines and cancel the motion.
  let pushed = false;
  // Keep the newest line in view as lines are added.
  const count = $derived(shown.length);
  $effect(() => {
    void count;
    if (pushed) pushed = false;
    else chat?.scrollTo({ top: chat.scrollHeight });
  });

  const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * A new line enters at full size from below and pushes the earlier lines up.
   * Opacity and transform only, 200 ms ease-out (docs/design.md, Motion).
   */
  function push(node: HTMLElement) {
    const list = node.parentElement;
    if (!list || reduceMotion()) return {};
    list.scrollTo({ top: list.scrollHeight });
    pushed = true;
    const shift = node.offsetHeight + parseFloat(getComputedStyle(list).rowGap);
    for (const li of list.children) {
      // If lines are still moving from the last push, start from where they are now.
      const now = new DOMMatrix(getComputedStyle(li).transform).m42;
      li.getAnimations().forEach((a) => a.cancel());
      li.animate([{ transform: `translateY(${now + shift}px)` }, { transform: 'none' }], {
        duration: 200,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      });
    }
    return {};
  }

  function advance(): void {
    if (mine && dialogue) sendAction('advance', { index: dialogue.index });
  }
</script>

<main>
  {#if dialogue}
    <TopBand {myRole} finished={review} />
  {/if}
  {#if dialogue?.finished}
    <div class="end">
      <p class="closing">{TITLE}<br />{END_MARK}</p>
      <p class="afterword">{AFTERWORD}</p>
    </div>
  {:else}
    <div class="read" out:fade={{ duration: reduceMotion() ? 0 : 200 }}>
      <ol class="chat" bind:this={chat}>
        {#each shown as l, i}
          <li in:push data-side={l.speaker === myRole ? 'right' : 'left'} data-current={i === dialogue?.index}>
            <img src={`./assets/icon-${l.speaker}.webp`} alt={SPEAKER_NAMES[l.speaker]} />
            <div class="body">
              <span class="name">{SPEAKER_NAMES[l.speaker]}</span>
              <p>{l.text}</p>
            </div>
          </li>
        {/each}
      </ol>
      <!-- Right under the newest line for both players: active for the reader, greyed for the other. -->
      <button type="button" disabled={!mine} onclick={advance}>
        {#if labelled}{STRINGS['hint.readThenTap']}{/if}<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M0 0h10L5 8z" /></svg>
      </button>
    </div>
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
    /* One cell: the chat and the end screen overlap while one gives way to the other. */
    display: grid;
    grid-template: minmax(0, 1fr) / minmax(0, 1fr);
    /* The HUD's bottom is measured from the safe area's top; the top band sits beside the HUD. */
    /* A gap under the band, so a line cut off by scrolling reads as the list's edge. */
    padding: calc(var(--safe-top, 0px) + var(--hud-y, 0px) + 0.5em) calc(var(--safe-right, 0px) + 0.8em)
      calc(var(--safe-bottom, 0px) + 0.8em) calc(var(--safe-left, 0px) + 0.8em);
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    /* Sizes are in em; the base scales with the screen's short side. */
    font-size: clamp(16px, 4.4vmin, 28px);
    overflow: hidden;
    user-select: none;
  }
  main > :global(*) {
    grid-area: 1 / 1;
  }
  /* The chat and, under it, the button for your turn. */
  .read {
    align-self: end;
    /* A reading width, so the eye does not cross a wide landscape screen between lines. */
    justify-self: center;
    width: 100%;
    max-width: 30em;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.6em;
  }
  .chat {
    min-height: 0;
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
    align-items: flex-start;
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
  .body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15em;
  }
  li[data-side='right'] .body {
    align-items: flex-end;
  }
  /* Who speaks, by name: side and icon alone are not enough to tell roles apart. */
  .name {
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    /* No text below 16px. */
    font-size: max(16px, 0.75em);
  }
  li p {
    margin: 0;
    /* Keep bubbles tight: padding here costs a lot of room on a phone. */
    padding: 0.35em 0.7em;
    border-radius: 0.8em;
    /* Break between phrases, never mid-word. */
    word-break: auto-phrase;
    background: var(--color-bubble);
  }
  /* Your role's lines, as in chat apps. */
  li[data-side='right'] p {
    background: var(--color-bubble-mine);
  }
  button {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 0.5em;
    margin: 0;
    padding: 0.45em 1.2em;
    border: none;
    border-radius: 999px;
    background: var(--color-mine-current);
    color: var(--color-mine-text);
    font: inherit;
    font-family: var(--font-ui);
    cursor: pointer;
  }
  button:disabled {
    background: var(--color-button-off);
    color: var(--color-text-quiet);
    cursor: default;
  }
  button svg {
    width: 0.55em;
    height: 0.45em;
    fill: currentColor;
  }
  /* The end mark holds for a moment, then the afterword replaces it (no opacity fade). */
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
    /* Comes in as the chat goes out, so the screen does not cut. */
    animation:
      fade-in 0.2s ease-out both,
      hide 0s 3s both;
  }
  .afterword {
    line-height: 2;
    /* If it wraps (portrait), break between phrases and keep the lines even. */
    word-break: auto-phrase;
    text-wrap: balance;
    animation: hide 0s 3s reverse both;
  }
  @media (prefers-reduced-motion: reduce) {
    .closing {
      animation: hide 0s 3s both;
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes hide {
    to {
      visibility: hidden;
    }
  }
</style>
