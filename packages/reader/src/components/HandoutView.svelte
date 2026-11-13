<!--
  Handout (HO) phase. The handout in tabs (./HandoutTabs.svelte), the last tab holding the
  settings your part fills in. In the footer, always in view: the time left, the button asking for
  more time, and the button that says you are done. That button stays greyed until every setting
  is filled in (optional ones may stay blank), and a dot on the settings tab shows where. Once
  tapped it says you are waiting for the others, your settings are locked, and the extension
  button gives way to one that takes done back. The phase ends when everyone is done or the time
  runs out (the server's deadline). Settings are sent as you type, so time running out loses none.
-->
<script lang="ts">
  import { type Handout, type HandoutState, HANDOUT_VALUE_MAX, settingsOf } from '@uzu-toolkit/kit';
  import { gameTime, minus } from '@uzuhq/code-sdk';
  import type { PhaseViewProps } from '../flow';
  import { sceneIn, sceneOut } from './motion';
  import HandoutTabs from './HandoutTabs.svelte';
  import FooterActions from './FooterActions.svelte';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  // `state` is renamed: the name clashes with the $state rune.
  let { state: phase, me, part, names, send, handout }: PhaseViewProps<HandoutState> & { handout: Handout } = $props();

  const settings = $derived(settingsOf(handout, part));
  const done = $derived(phase.ready[me] === true);
  // What you are typing, ahead of the state; sent as you type.
  let typed = $state<Record<string, string>>({});
  const value = (id: string): string => typed[id] ?? phase.values[part]?.[id] ?? '';
  const filled = $derived(settings.every((f) => f.optional || value(f.id).trim() !== ''));

  // Seconds left, from the game clock (it freezes while the game is paused).
  let left = $state(0);
  $effect(() => {
    const tick = () => (left = Math.max(0, Math.ceil(minus(phase.endsAt, gameTime()) / 1000)));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  });
  const clock = $derived(`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`);

  function commit(id: string): void {
    if (value(id) !== phase.values[part]?.[id]) send('set', { id, value: value(id) });
  }

  function finish(): void {
    for (const f of settings) commit(f.id);
    send('ready');
  }
</script>

<div class="handout" in:sceneIn|global out:sceneOut|global>
  <HandoutTabs {handout} {part} partName={names[part] ?? ''} mark={!done && !filled}>
    {#snippet fields()}
      <div class="fields">
        {#each settings as f (f.id)}
          <!-- Locked once done: the value shows as text, so nothing looks writable. -->
          <label>
            <span>{f.label}{#if f.optional}<span class="optional">{STRINGS['handout.optional']}</span>{/if}</span>
            {#if done}
              <span class="value" class:blank={!value(f.id).trim()}>{value(f.id).trim() || STRINGS['handout.blank']}</span>
            {:else}
              <!-- Grows with what is typed, so the example and long answers show whole. -->
              <textarea
                rows="1"
                maxlength={HANDOUT_VALUE_MAX}
                placeholder={f.example && STRINGS['handout.example'] + f.example}
                value={value(f.id)}
                oninput={(e) => {
                  typed[f.id] = e.currentTarget.value.replace(/\n/g, '');
                  commit(f.id);
                }}
                onkeydown={(e) => e.key === 'Enter' && e.preventDefault()}
              ></textarea>
            {/if}
          </label>
        {/each}
      </div>
    {/snippet}
  </HandoutTabs>
</div>
<FooterActions>
  <div class="actions">
    <span class="clock">{clock}</span>
    {#if done}
      <button type="button" class="quiet" onclick={() => send('unready')}>{STRINGS['handout.unready']}</button>
    {:else}
      <button type="button" class="quiet" onclick={() => send('extend')}>{STRINGS['handout.extend']}</button>
    {/if}
    <NextButton disabled={done || !filled} onclick={finish}>
      {STRINGS[done ? 'handout.waiting' : 'handout.done']}
    </NextButton>
  </div>
</FooterActions>

<style>
  /* Fills the area between the band and the footer with the tabs and their text. */
  .handout {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  .fields {
    display: grid;
    gap: 0.8em;
    font-family: var(--font-ui);
  }
  /* Each setting: its name, the input under it. */
  label {
    display: grid;
    gap: 0.3em;
    line-height: 1.5;
  }
  textarea {
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
    line-height: 1.5;
    resize: none;
    /* One line until the text needs more; older browsers still wrap inside one row's scroll. */
    field-sizing: content;
  }
  textarea::placeholder {
    color: var(--color-text-quiet);
  }
  textarea:focus-visible {
    outline: 2px solid var(--color-mine-current);
  }
  /* Marks a setting that may stay blank, after its name. */
  .optional {
    padding-inline-start: 0.6em;
    color: var(--color-text-quiet);
  }
  .blank {
    color: var(--color-text-quiet);
  }
  /* Time left, then the two buttons, together in one row in the footer. */
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
  /* Asking for more time, or taking back done, is not the next step: on the page colour, not filled. */
  .quiet {
    margin: 0;
    padding: 0.45em 0.8em;
    border: none;
    border-radius: 999px;
    background: var(--color-bg);
    color: var(--color-text);
    font: inherit;
    cursor: pointer;
  }
</style>
