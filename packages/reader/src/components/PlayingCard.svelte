<!--
  One playing card, face up, or its back when `card` is null. The faces are Adrian Kennard's CC0
  deck (../cards/), each loaded on first use, so a work without cards loads none. The card is
  `width` wide (em) at the deck's 5:7 shape. The corner index is a quarter of the width tall, so
  keep `width` at 4 or more to keep it at 16px or more (docs/design.md, Type).
-->
<script module lang="ts">
  import type { Card } from '@uzu-toolkit/kit';

  const faces = import.meta.glob<string>('../cards/*.svg', { query: '?url', import: 'default' });
  const load = (name: string): Promise<string> => faces[`../cards/${name}.svg`]();
</script>

<script lang="ts">
  let { card, width = 3 }: { card: Card | null; width?: number } = $props();

  let src = $state<string | null>(null);
  $effect(() => {
    let live = true;
    load(card ?? 'back').then((url) => live && (src = url));
    return () => (live = false);
  });
</script>

<span class="card" style:width="{width}em">
  {#if src}<img {src} alt="" draggable="false" />{/if}
</span>

<style>
  /* Holds the card's shape while the face loads, so nothing around it moves. */
  .card {
    display: block;
    aspect-ratio: 5 / 7;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
