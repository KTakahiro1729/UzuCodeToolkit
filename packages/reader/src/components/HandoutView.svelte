<!--
  Handout (HO) phase. One reading column: the shared text, your part's own text, then the
  settings your part fills in, and at the end the button that says you are done. The button
  stays greyed until every setting is filled in; once tapped it says you are waiting for the
  others, and your settings are locked. The phase ends when everyone is done.
-->
<script lang="ts">
  import { type Handout, type HandoutState, HANDOUT_VALUE_MAX, settingsOf } from '@uzu-toolkit/kit';
  // UI strings by key.
  import STRINGS from '../strings.json';

  // `state` is renamed: the name clashes with the $state rune.
  let {
    state: phase,
    me,
    part,
    send,
    handout,
  }: {
    state: HandoutState;
    me: string;
    part: string;
    parts: Record<string, string>;
    send(name: string, payload?: object): void;
    handout: Handout;
  } = $props();

  const own = $derived(handout.parts[part]);
  const fields = $derived(settingsOf(handout, part));
  const done = $derived(phase.ready[me] === true);
  // What you are typing, ahead of the state; sent when an input loses focus and before ready.
  let typed = $state<Record<string, string>>({});
  const value = (id: string): string => typed[id] ?? phase.values[part]?.[id] ?? '';
  const filled = $derived(fields.every((f) => value(f.id).trim() !== ''));

  function commit(id: string): void {
    if (value(id) !== phase.values[part]?.[id]) send('set', { id, value: value(id) });
  }

  function finish(): void {
    for (const f of fields) commit(f.id);
    send('ready');
  }
</script>

<div class="handout">
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
              oninput={(e) => (typed[f.id] = e.currentTarget.value)}
              onchange={() => commit(f.id)}
            />
          </label>
        {/each}
      </section>
    {/if}
    <button type="button" disabled={done || !filled} onclick={finish}>
      {STRINGS[done ? 'handout.waiting' : 'handout.done']}
    </button>
  </div>
</div>

<style>
  /* Fills the area under the band and scrolls; the column keeps a reading width. */
  .handout {
    height: 100%;
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
    padding-bottom: 0.8em;
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
    word-break: auto-phrase;
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
  /* Same pill as the advance button: filled when it is yours to tap, greyed otherwise. */
  button {
    align-self: center;
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
</style>
