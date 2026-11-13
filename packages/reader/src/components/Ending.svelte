<!--
  The end of a work: the title and end mark, then the post-game screen with the author's
  afterword, if any. The end mark holds for a moment, then gives way to the post-game screen;
  onreview() fires at that moment, so the band's phase can change with the screen.
-->
<script lang="ts">
  import type { Script } from '../script';
  // UI strings by key.
  import STRINGS from '../strings.json';

  let { script, onreview }: { script: Script; onreview?: () => void } = $props();

  // The afterword replaces the title and end mark after 3 s (the CSS below).
  $effect(() => {
    const t = setTimeout(() => onreview?.(), 3000);
    return () => clearTimeout(t);
  });
</script>

<div class="end">
  <p class="closing">{script.title}{#if script.end}<br />{script.end}{/if}</p>
  <section class="review">
    <h1>{STRINGS['review.heading']}</h1>
    {#if script.afterword}
      <div class="afterword">
        <h2>{STRINGS['review.afterword']}</h2>
        <p>{script.afterword}</p>
      </div>
    {/if}
  </section>
</div>

<style>
  /* The end mark holds for a moment, then fades out and the post-game screen fades in after it,
     one at a time so the two never show through each other. */
  .end {
    margin: auto;
    display: grid;
    place-items: center;
    text-align: center;
  }
  .end > * {
    grid-area: 1 / 1;
    margin: 0;
  }
  .closing {
    line-height: 2.4;
    /* Comes in as the chat goes out, so the screen does not cut. */
    animation:
      fade-in 0.2s ease-out both,
      fade-out 0.2s 2.8s ease-out both;
  }
  /* The post-game screen: a heading, and under it an area for the author's afterword. */
  .review {
    width: min(30em, calc(100vw - 1.6em));
    /* Text that can run to several lines starts at one left edge; the heading shares it. */
    text-align: start;
    display: grid;
    gap: 0.8em;
    animation: fade-in 0.2s 3s ease-out both;
  }
  /* The greeting stands for the whole screen, so it is centred. */
  h1 {
    margin: 0;
    text-align: center;
    font-family: var(--font-ui);
    font-size: 1.2em;
    font-weight: 700;
  }
  .afterword {
    display: grid;
    gap: 0.3em;
    padding: 1em 1.2em;
    border-radius: 0.8em;
    background: var(--color-bubble);
  }
  /* The area's label, on the same left edge as the text it names. */
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, 0.8em);
    font-weight: 700;
  }
  .afterword p {
    margin: 0;
    line-height: 2;
    /* If it wraps, break between phrases. */
    word-break: auto-phrase;
  }
  @media (prefers-reduced-motion: reduce) {
    .closing {
      animation: fade-out 0s 3s both;
    }
    .review {
      animation: fade-in 0s 3s both;
    }
  }
  /* Opacity only; visibility keeps a faded-out screen from being read or selected. */
  @keyframes fade-in {
    from {
      opacity: 0;
      visibility: hidden;
    }
  }
  @keyframes fade-out {
    to {
      opacity: 0;
      visibility: hidden;
    }
  }
</style>
