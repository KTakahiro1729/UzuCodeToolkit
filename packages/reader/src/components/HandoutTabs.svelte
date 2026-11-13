<!--
  A handout in tabs, one text per tab, so a long handout does not run as one scroll: the shared
  text, your part's own text, how your part sees the others, and the settings (`fields`, given by
  the screen: inputs while reading, the values afterwards). The tab bar stays put; the text under
  it scrolls, and starts from the top when the tab changes; the tab and the scroll position are
  remembered per `memory` key, so reopening resumes where the reader left off. An optional `guide` (what to do now)
  opens the first tab and scrolls away with its text. `mark` puts a dot on the settings tab
  while something there still needs you.
  Where there is room (about 18em per column, and a screen 480px tall) the tabs spread over up to
  3 columns, measured on this component's own width: each tab but the last ones gets a column and
  a caption, the last column keeps the rest as tabs. So a wide screen shows more of the handout
  at once, and the same handout in a narrower space (beside the screen) falls back by itself.
-->
<script lang="ts" module>
  /**
   * Where each reader left off, kept on this device only: the tab and how far its text is
   * scrolled. It outlives the screen, so closing the handout sheet and opening it again (or
   * coming back to the handouts) resumes there. `memory` in the props names the place.
   */
  const left: Record<string, { tab: string; scroll: number }> = {};
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import type { Handout } from '@uzu-toolkit/kit';
  import type { Snippet } from 'svelte';
  import Guide from './Guide.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let {
    handout,
    part,
    partName,
    fields,
    mark = false,
    guide,
    memory = 'handout',
  }: {
    handout: Handout;
    part: string;
    partName: string;
    fields?: Snippet;
    mark?: boolean;
    guide?: string;
    memory?: string;
  } = $props();

  const own = $derived(handout.parts[part]);
  type Tab = 'common' | 'own' | 'impressions' | 'fields';
  const tabs = $derived(
    [
      { id: 'common', label: STRINGS['handout.common'] },
      own && { id: 'own', label: partName },
      own?.impressions?.length && { id: 'impressions', label: STRINGS['handout.impressions'] },
      fields && own?.settings?.length && { id: 'fields', label: STRINGS['handout.tabFields'] },
    ].filter(Boolean) as { id: Tab; label: string }[],
  );
  // The tab chosen here; until then the one this reader left off at (`memory`), or the first.
  let chosen = $state<Tab>();
  const tab = $derived(chosen ?? (left[memory]?.tab as Tab | undefined) ?? 'common');
  let scroller = $state<HTMLElement>();

  // How many columns fit: measured in this component's own em, so the aside and the full screen
  // both get the right count. Short screens (phones held sideways) keep one.
  const COLUMN_EM = 18;
  const GAP_EM = 1.2;
  let box = $state<HTMLElement>();
  let fit = $state(1);
  $effect(() => {
    if (!box) return;
    const measure = () => {
      const em = parseFloat(getComputedStyle(box!).fontSize);
      const n = Math.floor((box!.clientWidth / em + GAP_EM) / (COLUMN_EM + GAP_EM));
      fit = innerHeight >= 480 ? Math.max(1, Math.min(3, n)) : 1;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  });
  const cols = $derived(Math.min(fit, tabs.length));
  // The first columns hold one tab each; the last holds the rest as tabs.
  const lead = $derived(tabs.slice(0, cols - 1));
  const rest = $derived(tabs.slice(cols - 1));
  // The chosen tab, or the first when another part's handout has no such tab.
  const current = $derived(rest.some((t) => t.id === tab) ? tab : rest[0]?.id);

  function choose(id: Tab): void {
    chosen = id;
    left[memory] = { tab: id, scroll: 0 };
    scroller?.scrollTo({ top: 0 });
  }
  // Resume the scroll of the remembered tab once the text is there.
  onMount(() => {
    if (left[memory]?.tab === current) scroller?.scrollTo({ top: left[memory].scroll });
  });
  const remember = () => (left[memory] = { tab: current, scroll: scroller?.scrollTop ?? 0 });
</script>

<div class="box" bind:this={box}>
  <div class="columns" class:one={cols === 1} style:grid-template-columns={`repeat(${cols}, minmax(0, 1fr))`}>
    {#each lead as t (t.id)}
      <section class="column">
        <h3>{t.label}{#if t.id === 'fields' && mark}<span class="dot" aria-hidden="true"></span>{/if}</h3>
        <div class="scroll panel">{@render body(t.id)}</div>
      </section>
    {/each}
    <section class="column last">
      {#if rest.length > 1}
        <div class="tabs" role="tablist">
          {#each rest as t (t.id)}
            <button type="button" role="tab" aria-selected={t.id === current} onclick={() => choose(t.id)}>
              {t.label}{#if t.id === 'fields' && mark}<span class="dot" aria-hidden="true"></span>{/if}
            </button>
          {/each}
        </div>
      {:else if rest[0]}
        <h3>{rest[0].label}{#if rest[0].id === 'fields' && mark}<span class="dot" aria-hidden="true"></span>{/if}</h3>
      {/if}
      <div class="scroll panel" class:first={rest.length > 1 && current === rest[0]?.id} role="tabpanel" bind:this={scroller} onscroll={remember}>
        {#if current}{@render body(current)}{/if}
      </div>
    </section>
  </div>
</div>

<!-- One tab's text; the guide opens the first tab. -->
{#snippet body(id: Tab)}
  {#if guide && id === tabs[0]?.id}<Guide text={guide} />{/if}
  {#if id === 'common'}
    {#each handout.common as para}<p>{para}</p>{/each}
  {:else if id === 'own' && own}
    <h2>{own.heading}</h2>
    {#each own.body as para}<p>{para}</p>{/each}
  {:else if id === 'impressions' && own?.impressions}
    {#each own.impressions as imp}<p><span class="who">{imp.name}</span>{imp.text}</p>{/each}
  {:else if id === 'fields' && fields}
    {@render fields()}
  {/if}
{/snippet}

<style>
  .box {
    min-height: 0;
    display: grid;
    grid-template-rows: minmax(0, 1fr);
  }
  /* Columns side by side; a single column keeps the reading width, centred. */
  .columns {
    min-height: 0;
    display: grid;
    column-gap: 1.2em;
  }
  .columns.one {
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    margin-inline: auto;
  }
  /* A column: the tab bar (or the caption of a lone tab) on top of the white text area, which fills the rest and scrolls. */
  .column {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }
  /* The caption of a column that holds one text, in the place of a tab bar. */
  h3 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.3em;
    padding: 0.5em 0.2em;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: inherit;
    font-weight: 700;
  }
  .tabs {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    font-family: var(--font-ui);
  }
  /* The chosen tab shares the text area's white, as a folder tab; the others sit on the page. */
  button {
    flex: none;
    display: flex;
    align-items: center;
    gap: 0.3em;
    margin: 0;
    padding: 0.5em 0.9em;
    border: none;
    border-radius: 0.6em 0.6em 0 0;
    background: none;
    color: var(--color-text-quiet);
    font: inherit;
    white-space: nowrap;
    cursor: pointer;
  }
  button[aria-selected='true'] {
    background: var(--color-bubble);
    color: var(--color-text);
    font-weight: 700;
  }
  /* Something on the settings tab still needs you. */
  .dot {
    width: 0.4em;
    height: 0.4em;
    border-radius: 50%;
    background: var(--color-text);
  }
  .panel {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.8em;
    padding: 1em 1.2em;
    border-radius: 0.8em;
    background: var(--color-bubble);
  }
  /* Square only where the chosen tab meets the area, so the two read as one piece. */
  .panel.first {
    border-start-start-radius: 0;
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
</style>
