<!--
  画面の枠。 フェーズごとに画面を出し分ける。
-->
<script lang="ts">
  import { game } from '../store.svelte';
  import DialogueView from './DialogueView.svelte';
  import { END_MARK, TITLE } from '../scenario';
</script>

<main class="frame">
  {#if !game.state}
    <p class="center">接続しています…</p>
  {:else if game.state.phase === 'dialogue'}
    <DialogueView snapshot={game.state} me={game.me} />
  {:else}
    <p class="center end"><span>{TITLE}</span><span>{END_MARK}</span></p>
  {/if}
</main>

<style>
  :root {
    --bg: #14121a;
    --paper: #f3ecdf;
    --ink: #2a2530;
    --muted: #8d8496;
    --accent: #c9853a;
  }
  .frame {
    position: fixed;
    inset: 0;
    /* Safe Area (ノッチ) を避ける。 値は main.ts が SDK の getInsets() から流す。 */
    padding: var(--safe-top, 0) var(--safe-right, 0) var(--safe-bottom, 0) var(--safe-left, 0);
    background: var(--bg);
    color: var(--paper);
    font-family: system-ui, 'Hiragino Sans', 'Noto Sans JP', sans-serif;
    /* 寸法は em。 基準を画面の短辺に比例させ、 端末の大きさに追従する。 */
    font-size: clamp(14px, 4.2vmin, 28px);
    overflow: hidden;
    user-select: none;
  }
  .end {
    grid-auto-flow: row;
    align-content: center;
    gap: 0.8em;
  }
  .center {
    display: grid;
    place-items: center;
    height: 100%;
    margin: 0;
  }
</style>
