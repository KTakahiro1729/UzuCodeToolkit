<!--
  Handout (HO) phase. The handout in tabs (./HandoutTabs.svelte), the last tab holding the
  settings your part fills in. In the footer, always in view: the time left (upper row), the button asking for
  more time, and the next button that says you are done. That button stays greyed until every setting
  is filled in (optional ones may stay blank), and a dot on the settings tab shows where. Once
  tapped it keeps its name, outlined in a dark 2px edge with a tick (tapping it again takes done back); your
  settings are locked and the extension button is greyed. Who is done is not shown while reading.
  Tapping a locked setting also takes done back and lets you type. The phase ends when everyone is
  done or the time runs out (the server's deadline). Settings are sent as you type, so time
  running out loses none.
-->
<script lang="ts">
  import { type Handout, type HandoutState, HANDOUT_VALUE_MAX, settingsOf } from '@uzu-toolkit/kit';
  import { gameTime, minus } from '@uzuhq/code-sdk';
  import type { PhaseViewProps } from '../flow';
  import { sceneIn, sceneOut } from './motion';
  import HandoutTabs from './HandoutTabs.svelte';
  import Button from './Button.svelte';
  import FooterActions from './FooterActions.svelte';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  // `state` is renamed: the name clashes with the $state rune.
  let {
    state: phase,
    me,
    part,
    names,
    send,
    handout,
    guide,
  }: PhaseViewProps<HandoutState> & { handout: Handout; guide?: string } = $props();

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
  <HandoutTabs {handout} {part} {guide} partName={names[part] ?? ''} mark={!done && !filled}>
    {#snippet fields()}
      <div class="fields">
        {#each settings as f (f.id)}
          <label>
            <span>{f.label}{#if f.optional}<span class="optional">{STRINGS['handout.optional']}</span>{/if}</span>
            <!-- Grows with what is typed, so the example and long answers show whole. Once done it
                 is locked but stays a field; tapping it takes done back and lets you type. -->
            <textarea
              rows="1"
              readonly={done}
              class:locked={done}
              maxlength={HANDOUT_VALUE_MAX}
              placeholder={done ? STRINGS['handout.blank'] : f.example && STRINGS['handout.example'] + f.example}
              value={value(f.id)}
              onclick={(e) => {
                if (!done) return;
                send('unready');
                e.currentTarget.focus();
              }}
              oninput={(e) => {
                typed[f.id] = e.currentTarget.value.replace(/\n/g, '');
                commit(f.id);
              }}
              onkeydown={(e) => e.key === 'Enter' && e.preventDefault()}
            ></textarea>
          </label>
        {/each}
      </div>
    {/snippet}
  </HandoutTabs>
</div>
<!-- The time left is state, so it sits in the footer's lower row; the buttons in the upper one. -->
<FooterActions place="status">
  <span class="clock">{STRINGS['status.timeLeft'].replace('{time}', clock)}</span>
  {#if done}<span>{STRINGS['status.waitOthers']}</span>{:else if !filled}<span>{STRINGS['status.fillSettings']}</span>{/if}
</FooterActions>
<FooterActions>
  <Button variant="secondary" disabled={done} onclick={() => send('extend')}>{STRINGS['handout.extend']}</Button>
  <NextButton on={done} disabled={!done && !filled} onclick={() => (done ? send('unready') : finish())}>
    {#if done}<svg class="tick" viewBox="0 0 12 10" aria-hidden="true"><path d="M1 5l3.5 3.5L11 1.5" /></svg>{/if}{STRINGS['button.next']}
  </NextButton>
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
    border-radius: var(--radius-control, 0.4em);
    background: var(--color-field, #ffffff);
    border: 1px solid var(--color-line, #6e7781);
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
  /* Done: the same field on the page's grey, so it reads as set and not as a greyed-out control. */
  textarea.locked {
    background: var(--color-bg);
    cursor: pointer;
  }
  textarea:focus-visible {
    outline: 2px solid var(--color-mine-current);
  }
  /* Marks a setting that may stay blank, after its name. */
  .optional {
    padding-inline-start: 0.6em;
    color: var(--color-text-quiet);
  }
  .clock {
    color: var(--color-text-quiet);
    font-variant-numeric: tabular-nums;
  }
  /* Done: the button keeps its name, outlined in a dark 2px edge with a tick, so it reads as pressed. */
  .tick {
    width: 0.8em;
    height: 0.7em;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
