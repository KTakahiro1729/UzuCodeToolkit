<!--
  What to do now, in a line or two at the top of a phase's screen (docs/design.md, Guide). It stays
  as long as the screen does and needs no tap. The text is the work's (PhaseView props `guide`).
-->
<script lang="ts">
  let { text }: { text: string } = $props();
</script>

<p>{text}</p>

<style>
  p {
    margin: 0;
    width: 100%;
    max-width: 30em;
    align-self: center;
    font-family: var(--font-ui);
    line-height: 1.7;
    white-space: pre-line;
    color: var(--color-text);
  }
</style>
