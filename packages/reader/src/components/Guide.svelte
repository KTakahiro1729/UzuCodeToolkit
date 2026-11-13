<!--
  What to do now, in a line or two at the top of a phase's screen (docs/design.md, Guide). It shows
  when the screen comes in and fades out after SHOWN_MS, keeping its room so nothing under it
  moves. It needs no tap. The text is the work's (PhaseView props `guide`).
-->
<script lang="ts">
  let { text }: { text: string } = $props();

  /** Long enough to read two lines; then the guide leaves the screen to its content. */
  const SHOWN_MS = 8000;
  let gone = $state(false);
  $effect(() => {
    const t = setTimeout(() => (gone = true), SHOWN_MS);
    return () => clearTimeout(t);
  });
</script>

<p class:gone aria-hidden={gone}>{text}</p>

<style>
  p {
    margin: 0;
    width: 100%;
    max-width: 30em;
    /* Centred as a column in a flex or a grid parent; the text in it stays left-aligned. */
    align-self: center;
    justify-self: center;
    font-family: var(--font-ui);
    line-height: 1.7;
    white-space: pre-line;
    color: var(--color-text);
    transition: opacity 250ms ease-out;
  }
  .gone {
    opacity: 0;
  }
  @media (prefers-reduced-motion: reduce) {
    p {
      transition: none;
    }
  }
</style>
