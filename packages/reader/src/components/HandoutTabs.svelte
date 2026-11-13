<!--
  A handout in tabs, one text per tab, so a long handout does not run as one scroll: the shared
  text, your part's own text, how your part sees the others, and the settings (`fields`, given by
  the screen: inputs while reading, the values afterwards). The tab bar stays put; the text under
  it scrolls, and starts from the top when the tab changes. `mark` puts a dot on the settings tab
  while something there still needs you.
-->
<script lang="ts">
  import type { Handout } from '@uzu-toolkit/kit';
  import type { Snippet } from 'svelte';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let {
    handout,
    part,
    partName,
    fields,
    mark = false,
  }: { handout: Handout; part: string; partName: string; fields?: Snippet; mark?: boolean } = $props();

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
  let tab = $state<Tab>('common');
  // The chosen tab, or the first when another part's handout has no such tab.
  const current = $derived(tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id);
  let scroller = $state<HTMLElement>();

  function choose(id: Tab): void {
    tab = id;
    scroller?.scrollTo({ top: 0 });
  }
</script>

<div class="tabs-wrap">
  <div class="tabs" role="tablist">
    {#each tabs as t (t.id)}
      <button type="button" role="tab" aria-selected={t.id === current} onclick={() => choose(t.id)}>
        {t.label}{#if t.id === 'fields' && mark}<span class="dot" aria-hidden="true"></span>{/if}
      </button>
    {/each}
  </div>
  <div class="panel" class:first={current === tabs[0]?.id} role="tabpanel" bind:this={scroller}>
    {#if current === 'common'}
      {#each handout.common as para}<p>{para}</p>{/each}
    {:else if current === 'own' && own}
      <h2>{own.heading}</h2>
      {#each own.body as para}<p>{para}</p>{/each}
    {:else if current === 'impressions' && own?.impressions}
      {#each own.impressions as imp}<p><span class="who">{imp.name}</span>{imp.text}</p>{/each}
    {:else if current === 'fields' && fields}
      {@render fields()}
    {/if}
  </div>
</div>

<style>
  /* The tab bar on top of the white text area, which fills the rest and scrolls. */
  .tabs-wrap {
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    min-height: 0;
    margin-inline: auto;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
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
    scrollbar-width: none;
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
