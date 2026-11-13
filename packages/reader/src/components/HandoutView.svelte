<!--
  Handout (HO) phase. One reading column: the shared text, your part's own text and how it sees
  the others, then the settings your part fills in. Under the column, always in view: the time
  left, the button asking for more time, and the button that says you are done. That button
  stays greyed until every setting is filled in; once tapped it says you are waiting for the
  others, your settings are locked and the extension button goes. The phase ends when everyone
  is done or the time runs out. Settings are sent as you type, so time running out loses none.
-->
<script lang="ts">
  import { type Handout, type HandoutState, HANDOUT_VALUE_MAX, settingsOf } from '@uzu-toolkit/kit';
  import { gameTime, minus } from '@uzuhq/code-sdk';
  import type { PhaseViewProps } from '../flow';
  import { sceneIn, sceneOut } from './motion';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  // `state` is renamed: the name clashes with the $state rune.
  let { state: phase, me, part, send, handout }: PhaseViewProps<HandoutState> & { handout: Handout } = $props();

  const own = $derived(handout.parts[part]);
  const fields = $derived(settingsOf(handout, part));
  const done = $derived(phase.ready[me] === true);
  // What you are typing, ahead of the state; sent as you type.
  let typed = $state<Record<string, string>>({});
  const value = (id: string): string => typed[id] ?? phase.values[part]?.[id] ?? '';
  const filled = $derived(fields.every((f) => value(f.id).trim() !== ''));

  // Seconds left, from the game clock (it freezes while the game is paused).
  let left = $state(0);
  $effect(() => {
    const tick = () => {
      left = Math.max(0, Math.ceil(minus(phase.endsAt, gameTime()) / 1000));
      // Every client reports the end; the logic checks it against the game time.
      if (left === 0 && !phase.timeUp) send('timeUp');
    };
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  });
  const clock = $derived(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);

  function commit(id: string): void {
    if (value(id) !== phase.values[part]?.[id]) send('set', { id, value: value(id) });
  }

  function finish(): void {
    for (const f of fields) commit(f.id);
    send('ready');
  }
</script>

<div class="handout" in:sceneIn|global out:sceneOut|global>
  <div class="scroll">
    <div class="column">
      <section>
        <h2>{STRINGS['handout.common']}</h2>
        {#each handout.common as para}<p>{para}</p>{/each}
      </section>
      {#if own}
        <section>
          <h2>{own.heading}</h2>
          {#each own.body as para}<p>{para}</p>{/each}
        </section>
        {#if own.impressions?.length}
          <section>
            <h2>{STRINGS['handout.impressions']}</h2>
            {#each own.impressions as imp}<p><span class="who">{imp.name}</span>{imp.text}</p>{/each}
          </section>
        {/if}
      {/if}
      {#if fields.length}
        <section class="fields">
          <h2>{STRINGS['handout.fields']}</h2>
          {#each fields as f (f.id)}
            <label>
              <span>{f.label}</span>
              <input
                type="text"
                maxlength={HANDOUT_VALUE_MAX}
                placeholder={f.example && STRINGS['handout.example'] + f.example}
                disabled={done}
                value={value(f.id)}
                oninput={(e) => {
                  typed[f.id] = e.currentTarget.value;
                  commit(f.id);
                }}
              />
            </label>
          {/each}
        </section>
      {/if}
    </div>
  </div>
  <div class="actions">
    <span class="clock">{clock}</span>
    {#if !done}
      <button type="button" class="extend" onclick={() => send('extend')}>{STRINGS['handout.extend']}</button>
    {/if}
    <NextButton disabled={done || !filled} onclick={finish}>
      {STRINGS[done ? 'handout.waiting' : 'handout.done']}
    </NextButton>
  </div>
</div>

<style>
  /* Fills the area under the band: the text scrolls, the actions stay under it. */
  .handout {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0.6em;
  }
  .scroll {
    overflow-y: auto;
    scrollbar-width: none;
  }
  .column {
    box-sizing: border-box;
    max-width: 30em;
    margin-inline: auto;
    display: flex;
    flex-direction: column;
    gap: 0.8em;
  }
  /* One area per text, as the afterword: a label on the text's left edge, the text on white. */
  section {
    display: grid;
    gap: 0.6em;
    padding: 1em 1.2em;
    border-radius: 0.8em;
    background: var(--color-bubble);
  }
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, 0.8em);
    font-weight: 700;
  }
  p {
    margin: 0;
    line-height: 2;
    /* The text's own line breaks start paragraphs. */
    white-space: pre-line;
    /* Long prose fills each line; breaking by phrase would leave a ragged right edge. */
    line-break: strict;
  }
  /* Whom an impression is about, ahead of it, as UI text. */
  .who {
    padding-inline-end: 0.6em;
    font-family: var(--font-ui);
    font-weight: 700;
  }
  .fields {
    gap: 0.8em;
    font-family: var(--font-ui);
  }
  /* Each setting: its name, the input under it. */
  label {
    display: grid;
    gap: 0.3em;
    line-height: 1.5;
  }
  input {
    box-sizing: border-box;
    width: 100%;
    margin: 0;
    padding: 0.45em 0.7em;
    border: none;
    border-radius: 0.5em;
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    /* No smaller than 16px, which also keeps phones from zooming in on focus. */
    font-size: max(16px, 1em);
  }
  input::placeholder {
    color: var(--color-text-quiet);
  }
  input:disabled {
    color: var(--color-text);
  }
  /* Time left, then the two buttons, together in one row under the column. */
  .actions {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.6em;
    font-family: var(--font-ui);
  }
  .clock {
    color: var(--color-text-quiet);
    font-variant-numeric: tabular-nums;
  }
  /* Asking for more time is not the next step, so it is plain text on the page, not filled. */
  .extend {
    margin: 0;
    padding: 0.45em 0.8em;
    border: none;
    border-radius: 999px;
    background: var(--color-bubble);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
</style>
