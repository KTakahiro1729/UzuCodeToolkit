/**
 * Phase changes: the old screen fades out, then the new one fades in, one at a time so the two
 * never show through each other. Opacity only, 200 ms each, instant with reduced motion
 * (docs/design.md, Motion). The first screen, shown as the game loads, does not fade in.
 * Use them as global transitions (`in:sceneIn|global`), since the phase's block is the flow's.
 */

import { fade } from 'svelte/transition';

const duration = (): number => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
let loaded = false;

export const sceneOut = (node: Element) => fade(node, { duration: duration() });
export function sceneIn(node: Element) {
  if (!loaded) {
    loaded = true;
    return { duration: 0 };
  }
  return fade(node, { duration: duration(), delay: duration() });
}
