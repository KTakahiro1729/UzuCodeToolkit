<!--
  画面。 文字は台本だけ。 誰の番かは背景色で示す:
  自分の番は行が明るい紙色になり、 画面のどこをタップしても次へ送れる。
  ほかの人の番は行が沈んだ色のまま。 読んだ行は上に薄く残る。
-->
<script lang="ts">
  import { currentLine } from '@uzu-toolkit/kit';
  import { END_MARK, LINES, SPEAKER_NAMES, TITLE } from '../scenario';
  import { game, sendAction } from '../store.svelte';

  const dialogue = $derived(game.state?.dialogue);
  const line = $derived(dialogue ? currentLine(LINES, dialogue) : null);
  const mine = $derived(!!line && !!game.me && game.state?.roles[game.me] === line.speaker);
  const past = $derived(dialogue ? LINES.slice(0, dialogue.index) : []);

  function advance(): void {
    if (mine && dialogue) sendAction('advance', { index: dialogue.index });
  }
</script>

<main data-mine={mine} onclick={advance} role="presentation">
  {#if dialogue?.finished}
    <p class="end">{TITLE}<br />{END_MARK}</p>
  {:else if line}
    <ol class="past">
      {#each past as l}
        <li><span class="speaker">{SPEAKER_NAMES[l.speaker]}</span><span>{l.text}</span></li>
      {/each}
    </ol>
    <section class="current">
      <span class="speaker">{SPEAKER_NAMES[line.speaker]}</span>
      <p class="text">{line.text}</p>
    </section>
  {/if}
</main>

<style>
  /* しっぽり明朝 (Google Fonts、 OFL) を台本の文字だけにサブセットして同梱。 作り方は CLAUDE.md。 */
  @font-face {
    font-family: 'Shippori Mincho';
    src: url('../fonts/ShipporiMincho-Regular.subset.woff2') format('woff2');
    font-display: block;
  }
  :global(body) {
    margin: 0;
  }
  main {
    --bg: #17151d;
    --paper: #f1e9dc;
    --ink: #24202b;
    --dim: #3a3542;
    position: fixed;
    inset: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 1.2em;
    padding: max(var(--hud-y, 0px), var(--safe-top, 0px)) calc(var(--safe-right, 0px) + 1.5em)
      calc(var(--safe-bottom, 0px) + 1.5em) calc(var(--safe-left, 0px) + 1.5em);
    background: var(--bg);
    color: var(--paper);
    font-family: 'Shippori Mincho', serif;
    /* 寸法は em。 基準を画面の短辺に比例させる。 */
    font-size: clamp(14px, 4.4vmin, 28px);
    overflow: hidden;
    user-select: none;
  }
  main[data-mine='true'] {
    cursor: pointer;
  }
  /* フォントは Regular だけ同梱するので太字にしない。 話者は台詞より少し沈める。 */
  .speaker {
    opacity: 0.7;
  }
  .past {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.3em;
    opacity: 0.45;
    font-size: 0.8em;
  }
  /* 話者と台詞は別の列。 話者の列幅をそろえて、 台詞の頭を縦に並べる。 */
  .past li {
    display: grid;
    grid-template-columns: 2.5em 1fr;
  }
  .current {
    display: grid;
    gap: 0.6em;
  }
  /* 話者は台詞の箱の外に置き、 箱には台詞だけを入れる。 */
  .current .speaker {
    padding-left: 1.2em;
    font-size: 0.8em;
  }
  .text {
    margin: 0;
    padding: 1em 1.2em;
    border-radius: 0.6em;
    background: var(--dim);
    transition: background 0.2s, color 0.2s;
  }
  main[data-mine='true'] .text {
    background: var(--paper);
    color: var(--ink);
  }
  .end {
    margin: auto;
    text-align: center;
    line-height: 2.4;
  }
</style>
