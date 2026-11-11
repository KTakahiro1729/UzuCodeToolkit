<!--
  読み合わせ。 台本を全員で声に出す時間。
  1 回目のタップで文字送りを全文にし (誰でも)、 2 回目で次の行へ送る (担当だけ)。
-->
<script lang="ts">
  import {
    canAdvance,
    currentLine,
    currentReader,
    nextReader,
    readLines,
    tapIntent,
  } from '@uzu-toolkit/kit/dialogue';
  import type { State } from '../logic';
  import { OPENING, ROLE_IDS, SPEAKER_NAMES, TITLE } from '../scenario';
  import { sendAction } from '../store.svelte';

  let { snapshot, me }: { snapshot: State; me: string | null } = $props();

  const CHAR_MS = 40;

  const progress = $derived(snapshot.dialogue);
  const myRole = $derived(me ? snapshot.roles[me] : undefined);
  const line = $derived(currentLine(OPENING, progress));
  const reader = $derived(currentReader(OPENING, progress, ROLE_IDS));
  const upcoming = $derived(nextReader(OPENING, progress, ROLE_IDS));
  const isReader = $derived(canAdvance(OPENING, progress, myRole, ROLE_IDS));
  const history = $derived(readLines(OPENING, progress).slice(0, -1));
  const agreed = $derived(me ? progress.skipAgreed.includes(me) : false);
  const playerCount = $derived(Object.keys(snapshot.roles).length);

  // 文字送りは端末ごとの状態。 共有 state には書かない。
  let shown = $state(0);
  const fullyShown = $derived(line ? shown >= line.text.length : true);

  $effect(() => {
    // 行が変わったら最初から文字送りする。
    const text = line?.text ?? '';
    shown = 0;
    const timer = setInterval(() => {
      shown += 1;
      if (shown >= text.length) clearInterval(timer);
    }, CHAR_MS);
    return () => clearInterval(timer);
  });

  function nameOf(id: string | null | undefined): string {
    return id ? (SPEAKER_NAMES[id] ?? id) : '';
  }

  function onTap(): void {
    const intent = tapIntent({ fullyShown, isReader, finished: progress.finished });
    if (intent === 'reveal' && line) shown = line.text.length;
    if (intent === 'advance') sendAction('advance', { index: progress.index });
  }
</script>

<section class="dialogue">
  <header>
    <span class="label">{TITLE}</span>
    <span class="turn" data-mine={isReader}>
      {#if isReader}あなた ({nameOf(myRole)}) が読む番です{:else}{nameOf(reader)} さんが読む番です{/if}
    </span>
  </header>

  <ol class="log" aria-label="読んだ行">
    {#each history as past}
      <li>
        {#if past.speaker}<b>{nameOf(past.speaker)}</b>{/if}
        <span>{past.text}</span>
      </li>
    {/each}
  </ol>

  <button class="current" type="button" onclick={onTap} data-reader={isReader}>
    {#if line}
      <span class="speaker">{line.speaker ? nameOf(line.speaker) : '地の文'}</span>
      <span class="text">{line.text.slice(0, shown)}</span>
      <span class="hint">
        {#if !fullyShown}タップで全文{:else if isReader}読み終えたらタップで次へ{:else}{nameOf(reader)} さんが送ります{/if}
      </span>
    {/if}
  </button>

  <footer>
    <span class="next">
      {#if upcoming}次は {nameOf(upcoming)}{upcoming === myRole ? ' (あなた)' : ''}{:else}最後の行です{/if}
    </span>
    {#if myRole}
      <button class="skip" type="button" data-agreed={agreed} onclick={() => sendAction('skip')}>
        {agreed ? '読み飛ばしを取り消す' : '読み飛ばしに同意'} ({progress.skipAgreed.length}/{playerCount})
      </button>
    {/if}
  </footer>
</section>

<style>
  .dialogue {
    display: grid;
    grid-template-rows: auto 1fr auto auto;
    gap: 0.5em;
    height: 100%;
    padding: 0.6em 1em;
    box-sizing: border-box;
  }
  header {
    /* UZU の HUD (左上) に重ならないよう、 HUD の右から書き始める。 */
    padding-left: var(--hud-x, 0);
    min-height: var(--hud-y, 0);
    display: flex;
    gap: 1em;
    align-items: baseline;
  }
  .label {
    color: var(--accent);
    font-weight: bold;
  }
  .turn[data-mine='true'] {
    color: var(--accent);
    font-weight: bold;
  }
  .log {
    margin: 0;
    padding: 0;
    list-style: none;
    overflow-y: auto;
    color: var(--muted);
    font-size: 0.8em;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .log b {
    margin-right: 0.5em;
  }
  .current {
    display: grid;
    gap: 0.3em;
    min-height: 5em;
    padding: 0.6em 0.9em;
    border: 0.12em solid var(--muted);
    border-radius: 0.4em;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .current[data-reader='true'] {
    border-color: var(--accent);
  }
  .speaker {
    font-weight: bold;
    font-size: 0.85em;
  }
  .hint {
    justify-self: end;
    font-size: 0.7em;
    color: var(--muted);
  }
  footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8em;
  }
  .skip {
    font: inherit;
    padding: 0.3em 0.8em;
    border-radius: 0.4em;
    border: 0.1em solid var(--muted);
    background: transparent;
    color: var(--paper);
  }
  .skip[data-agreed='true'] {
    border-color: var(--accent);
    color: var(--accent);
  }
</style>
