<!--
  What to do now, in a line or two at the top of a phase's screen (docs/design.md, Guide). It sits
  in the screen's content, so it scrolls away with it; it never floats over the screen. It needs no
  tap. The text is the work's (PhaseView props `guide`).
-->
<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<p class="guide">{text}</p>

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
  }
</style>
