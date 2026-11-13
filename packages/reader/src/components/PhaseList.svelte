<!--
  The work's phases in order, numbered, to see where the game is and what comes next. Phases in
  a row that share a label (such as the handouts and the pause after them) are one entry. The
  current one sits on white; those already over are in the quieter text colour. Nothing here
  moves the game.
-->
<script lang="ts">
  let { labels, at }: { labels: readonly string[]; at: number } = $props();

  const entries = $derived(
    labels.reduce<{ label: string; first: number; last: number }[]>((list, label, i) => {
      const prev = list.at(-1);
      if (prev && prev.label === label) prev.last = i;
      else list.push({ label, first: i, last: i });
      return list;
    }, []),
  );
</script>

<ol>
  {#each entries as e, n (e.first)}
    <li data-now={e.first <= at && at <= e.last} data-past={e.last < at}>
      <span class="num">{n + 1}</span>{e.label}
    </li>
  {/each}
</ol>

<style>
  ol {
    box-sizing: border-box;
    width: 100%;
    max-width: 30em;
    margin-block: 0;
    margin-inline: auto;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    font-family: var(--font-ui);
  }
  li {
    display: flex;
    gap: 0.8em;
    padding: 0.6em 1em;
    border-radius: 0.6em;
    line-height: 1.5;
  }
  .num {
    min-width: 1.2em;
    text-align: end;
    font-variant-numeric: tabular-nums;
  }
  li[data-past='true'] {
    color: var(--color-text-quiet);
  }
  li[data-now='true'] {
    background: var(--color-bubble);
    font-weight: 700;
  }
</style>
