<!--
  The time left until `endsAt` (game time), as "m:ss". It ticks while shown. Bind `seconds` to read
  the whole seconds left, so a screen can change what it says once time is up.
-->
<script lang="ts">
  import { formatClock, secondsLeft } from '@uzu-toolkit/kit';
  import { type GameTime, gameTime } from '@uzuhq/code-sdk';

  let { endsAt, seconds = $bindable(0) }: { endsAt: GameTime; seconds?: number } = $props();

  $effect(() => {
    const tick = () => (seconds = secondsLeft(endsAt, gameTime()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  });
</script>

{formatClock(seconds)}
