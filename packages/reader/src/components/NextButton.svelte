<!--
  The button that moves the game on: the advance button of the read-through, and the next
  button of other scenes. The primary Button: filled for whoever can tap it, greyed for the others.
  With `on` it is a toggle: tapped once it is outlined with a dark 2px edge and a tick, and tapping it again takes it back.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  let {
    disabled = false,
    on = undefined,
    label = undefined,
    onclick,
    children,
  }: { disabled?: boolean; on?: boolean; label?: string; onclick: () => void; children: Snippet } = $props();
</script>

<Button {disabled} {on} {label} {onclick}>{@render children()}</Button>
