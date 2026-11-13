<!--
  The button that moves the game on: the advance button of the read-through, and the next
  button of other scenes. The primary Button: filled for whoever can tap it, greyed for the others.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  let { disabled = false, onclick, children }: { disabled?: boolean; onclick: () => void; children: Snippet } = $props();
</script>

<Button {disabled} {onclick}>{@render children()}</Button>
