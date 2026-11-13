/**
 * Entry '@uzu-toolkit/reader/stage': the read-through on UZU's design guide layout. A work uses it as
 * the read-through's screen: `{ view: ReadThroughView, props: { script, screen: StageReadThrough } }`.
 * Behind an entry of its own so a work that keeps the chat bubbles ships none of it.
 */
export { default as StageReadThrough } from './components/StageReadThrough.svelte';
export { LAYOUT, REFERENCE, type Orientation, type Rect, type StageLayout } from './stage-layout';
