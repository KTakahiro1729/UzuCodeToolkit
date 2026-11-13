/**
 * Entry '@uzu-toolkit/reader/stage': the read-through on UZU's design guide layout. A work uses it as
 * the read-through's screen: `{ view: ReadThroughView, props: { script, screen: StageReadThrough } }`.
 * Behind an entry of its own so a work that keeps the chat bubbles ships none of it.
 */
export { default as StageReadThrough } from './components/StageReadThrough.svelte';
export { LAYOUT, READ_THROUGH_LAYOUT, REFERENCE, stageLayoutOf, type StageLayout } from './stage-layout';
export {
  alignOf,
  boxIn,
  layoutProblems,
  orientationsOf,
  rectOf,
  type Align,
  type LayoutArea,
  type LayoutPart,
  type LayoutScene,
  type Orientation,
  type Rect,
  type ScreenLayout,
} from './layout';
