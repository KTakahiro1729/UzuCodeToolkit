<!--
  The read-through on UZU's stage layout (stage-layout.ts): the guide's 6 screens in both orientations.
  Standing characters, one dialogue frame with the line being read, two nameplates, and over them
  the log panel. It fills the whole screen, band and footer included, since the guide's numbers
  are the whole screen's: the next button and the log link sit in the frame instead of the footer.
  Your turn: the frame and nameplate ① take your colour and the next button shows. Another's
  turn: no button; when you read next, nameplate ② takes your colour and shows your next line.
-->
<script lang="ts">
  import { currentLine, type DialogueProgress, parseRuby, readerOf } from '@uzu-toolkit/kit';
  import { fade } from 'svelte/transition';
  import type { Line, Scenario } from '../script';
  import { LAYOUT, NAME_GAP, NAME_WIDTH, place, REFERENCE, type Rect, stageScene } from '../stage-layout';
  import { sceneIn, sceneOut } from './motion';
  import NextButton from './NextButton.svelte';
  // UI strings by key.
  import STRINGS from '../strings';

  let {
    scenario,
    progress,
    myPart,
    onadvance,
    final = true,
  }: {
    scenario: Scenario;
    progress: DialogueProgress;
    /** The part you play (State parts[seat]). */
    myPart: string | undefined;
    /** Your tap on the next button, with the line you were looking at (the action's payload). */
    onadvance: (index: number) => void;
    /** True when the last line ends the work; false when another scene follows. */
    final?: boolean;
  } = $props();

  const LINES = $derived(scenario.script.lines);
  const myRoles = $derived(scenario.rolesOf(myPart));
  const line = $derived(currentLine(LINES, progress));
  const scene = $derived(line ? stageScene(LINES, progress.index, myRoles, (l) => scenario.isDirection(l as Line)) : null);
  const last = $derived(progress.index === LINES.length - 1);

  // The layout follows the screen's orientation; its size follows the screen (--u, in CSS).
  let landscape = $state(innerWidth >= innerHeight);
  const orientation = $derived(landscape ? 'landscape' : 'portrait');
  const L = $derived(LAYOUT[orientation]);
  const ref = $derived(REFERENCE[orientation]);

  const nameOf = (l: Line): string => (scenario.isDirection(l) ? STRINGS['stage.narration'] : scenario.nameOf(l, STRINGS['name.and']));
  const plain = (t: string): string => parseRuby(t).map((s) => s.text).join('');
  // The latest scene heading up to this line: the guide's tag (place, time, chapter).
  const heading = $derived(LINES.slice(0, progress.index + 1).reverse().find((l) => l.scene)?.scene);
  const next = $derived(scene?.next ? LINES[scene.next.index] : undefined);

  // Nameplate ①'s least width: yours holds the name and "your turn"; narration is a little wider than a bare name; another's name alone fits the name.
  const w1 = $derived(scene?.mine ? NAME_WIDTH.full : scene?.direction ? NAME_WIDTH.narration : 0);

  // Your tap on the next button.
  function advance(): void {
    if (scene?.mine) onadvance(progress.index);
  }

  // The log panel, over any scene.
  let logOpen = $state(false);
  const shown = $derived(LINES.slice(0, progress.index + 1));
  const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;

  /** The panel is a modal: focus starts on its close button and returns to what opened it. */
  function modal(node: HTMLElement) {
    const opener = document.activeElement as HTMLElement | null;
    node.querySelector('button')?.focus();
    return { destroy: () => opener?.focus() };
  }
  /** The oldest line first, so the list starts at the newest. */
  function toEnd(node: HTMLElement) {
    node.scrollTop = node.scrollHeight;
  }

  // A character's standing picture is public/assets/stand-<role>.webp; a work without one shows none.
  const noPicture = (e: Event): void => {
    (e.currentTarget as HTMLImageElement).hidden = true;
  };
</script>

<svelte:window onresize={() => (landscape = innerWidth >= innerHeight)} onkeydown={(e) => logOpen && e.key === 'Escape' && (logOpen = false)} />

{#snippet figure(role: string, rect: Rect, kind: string)}
  <img class="figure" data-overflow-ok data-kind={kind} style={place(rect)} src={`./assets/stand-${role}.webp`} alt="" onerror={noPicture} />
{/snippet}

{#snippet text(t: string)}{#each parseRuby(t) as seg}{#if seg.ruby}<span class="rb">{seg.text}<span class="rt">{seg.ruby}</span></span>{:else}{seg.text}{/if}{/each}{/snippet}

{#if scene && line}
  <div class="stage" data-stage in:sceneIn|global out:sceneOut|global>
    <div class="fit" class:mine={scene.mine} style:--w={ref.width} style:--ratio={ref.width / ref.height} style:--tag-x={L.tag[0]} data-scene={scene.id} data-orientation={orientation} data-log={logOpen || undefined}>
      <div class="scene" inert={logOpen}>
        {#if heading}<div class="tag" style="top:calc({L.tag[1]} * var(--u));width:calc({L.tag[2]} * var(--u));height:calc({L.tag[3]} * var(--u))">{heading}</div>{/if}

        {#if scene.chars === 'solo' && scene.speaker}
          {@render figure(scene.speaker, L.solo, 'solo')}
        {:else}
          {#if scene.second}{@render figure(scene.second, L.c2, 'second')}{/if}
          {#if scene.speaker}{@render figure(scene.speaker, L.c1, 'speaker')}{/if}
        {/if}

        <div class="frame" style={place(L.frame)}></div>
        <p class="line" style={place(L.text)} aria-live="polite">{@render text(line.text)}</p>

        <div class="names" style={place(L.names)} style:--gap="{NAME_GAP}">
          <span class="plate one" class:mine={scene.mine} style:--min={w1}>
            <span class="who">{nameOf(line)}</span>
            {#if scene.mine}<span class="turn">{STRINGS['stage.yourTurn']}</span>{/if}
          </span>
          {#if scene.plate2 && scene.next && next}
            <span class="plate two" class:mine={scene.next.mine && !scene.mine} class:fixed={scene.plate2 === 'tag'} style:--fixed={L.nextTagWidth}>
              <span class="mark">{STRINGS['stage.next']}</span>
              {#if scene.plate2 === 'tag'}
                <span class="who">{nameOf(next)}</span>
              {:else}
                {#if !scene.next.mine}<span class="who">{nameOf(next)}</span>{/if}
                <!-- Cut short with an ellipsis on purpose: the guide shows the next line on one line. -->
                <span class="preview" data-overflow-ok>{plain(next.text)}</span>
              {/if}
            </span>
          {/if}
        </div>

        {#if scene.mine}
          <div class="next" data-uzu-actions="main" style="top:calc({L.next[1]} * var(--u));right:calc({ref.width - L.next[0] - L.next[2]} * var(--u));min-width:calc({L.next[2]} * var(--u));min-height:calc({L.next[3]} * var(--u))">
            <NextButton onclick={advance}>
              {STRINGS[last ? (final ? 'button.end' : 'button.nextPhase') : 'stage.nextLine']}
            </NextButton>
          </div>
        {/if}
        <button type="button" class="log-link" style={place(L.log)} onclick={() => (logOpen = true)}>{STRINGS['log.open']}</button>
      </div>

      {#if logOpen}
        <div class="panel" style={place(L.panel)} role="dialog" aria-modal="true" aria-labelledby="log-title" use:modal transition:fade|global={{ duration }}>
          <div class="head">
            <h2 id="log-title">{STRINGS['log.title']}</h2>
            <button type="button" class="close" aria-label={STRINGS['sheet.close']} onclick={() => (logOpen = false)}>
              <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 2l8 8M10 2l-8 8" /></svg>
            </button>
          </div>
          <ol class="rows scroll" data-uzu-scroll use:toEnd>
            {#if scenario.script.notice}<li class="notice">{scenario.script.notice}</li>{/if}
            {#each shown as l}
              <li data-mine={myRoles.includes(readerOf(l))}>
                <span class="who">{nameOf(l)}</span>
                <span class="said">{@render text(l.text)}</span>
              </li>
            {/each}
          </ol>
        </div>
      {/if}
    </div>
    {#if logOpen}
      <!-- Escape and the close button are the keyboard's ways out; the dimmed screen is a tap target only. -->
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="scrim" data-overflow-ok transition:fade|global={{ duration }} onclick={() => (logOpen = false)}></div>
    {/if}
  </div>
{/if}

<style>
  /* While the stage is up it is the whole screen: the frame's band and footer give way to it. */
  :global(:root:has([data-stage])) :global(:is(header, footer)) {
    display: none;
  }
  /* The screen, scaled to fit: the guide's reference size, centred (a screen of another shape keeps bars). */
  .stage {
    position: fixed;
    inset: 0;
    z-index: 3;
    container-type: size;
    display: grid;
    place-items: center;
    background: var(--color-bg);
    color: var(--color-text);
    font-family: var(--font-body);
    user-select: none;
  }
  .fit {
    --fit: min(100cqw, calc(100cqh * var(--ratio)));
    /* One reference px in screen px: every part's place and size is in these. */
    --u: calc(var(--fit) / var(--w));
    --frame-bg: var(--color-bubble);
    --frame-text: var(--color-text);
    position: relative;
    width: var(--fit);
    aspect-ratio: var(--ratio);
    /* The guide's 18px on 28px, a little more or less with the screen; no text below 16px. */
    font-size: max(16px, calc(18 * var(--u)));
    line-height: calc(28 * var(--u));
  }
  .fit.mine {
    --frame-bg: var(--color-mine-current);
    --frame-text: var(--color-mine-text);
  }
  .scene,
  .tag,
  .figure,
  .frame,
  .line,
  .names,
  .next,
  .log-link,
  .panel {
    position: absolute;
    box-sizing: border-box;
  }
  .scene {
    inset: 0;
  }
  .tag {
    display: flex;
    align-items: center;
    /* Clear of the UZU HUD where it is wider than the guide's logo. */
    left: max(calc(var(--tag-x) * var(--u)), calc(var(--safe-left, 0px) + var(--hud-x, 0px) + 0.4em));
    padding: 0 0.6em;
    border-radius: var(--radius-control);
    background: var(--color-bubble);
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, calc(14 * var(--u)));
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .figure {
    object-fit: contain;
    object-position: bottom center;
  }
  /* The log shows no characters. */
  .fit[data-log] .figure {
    visibility: hidden;
  }
  .frame {
    border-radius: var(--radius-read);
    background: var(--frame-bg);
  }
  /* The line: two lines landscape, three portrait; a longer one scrolls. */
  .line {
    margin: 0;
    overflow-y: auto;
    color: var(--frame-text);
    word-break: auto-phrase;
  }
  .rb {
    position: relative;
  }
  .rt {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
    font-size: 0.5em;
    line-height: 1;
  }
  /* Both nameplates in one row, sitting over the frame's top edge. */
  .names {
    display: flex;
    gap: calc(var(--gap) * var(--u));
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: max(16px, calc(16 * var(--u)));
    line-height: 1;
  }
  .plate {
    box-sizing: border-box;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0 0.5em;
    border-radius: var(--radius-control);
    background: var(--color-bubble);
    color: var(--color-text);
    white-space: nowrap;
  }
  .plate.mine {
    background: var(--color-mine-current);
    color: var(--color-mine-text);
  }
  .plate.one {
    flex: none;
    min-width: calc(var(--min) * var(--u));
    max-width: 75%;
  }
  .plate.two {
    flex: 1;
  }
  /* The guide's width for the mark and name, giving way to a longer ①. */
  .plate.two.fixed {
    flex: 0 1 calc(var(--fixed) * var(--u));
  }
  .who {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .turn,
  .mark {
    flex: none;
  }
  .turn {
    font-weight: 400;
  }
  /* The next line, one line, cut short with an ellipsis. */
  .preview {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 400;
  }
  /* The next button grows leftwards when its label is longer than the guide's 120px. */
  .next {
    display: flex;
    justify-content: flex-end;
    font-family: var(--font-ui);
    --button-pad-y: 0.2em;
    --button-pad-x: 0.6em;
  }
  .next :global(button) {
    min-height: max(44px, calc(44 * var(--u)));
    white-space: nowrap;
  }
  /* On your turn the frame is the button's blue, so the button is dark to stand out from it. */
  .next :global(button[data-variant='primary']) {
    background: var(--color-text);
    color: var(--color-bubble);
  }
  .log-link {
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    color: var(--frame-text);
    font: inherit;
    font-family: var(--font-ui);
    font-size: max(16px, calc(16 * var(--u)));
    text-decoration: underline;
    cursor: pointer;
  }
  /* The log: the screen dims, and a white panel lists every line read, oldest first. */
  .scrim {
    position: absolute;
    inset: 0;
    background: var(--color-scrim);
  }
  .panel {
    z-index: 1;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.4em;
    padding: 0.6em 0.9em;
    border-radius: var(--radius-read);
    background: var(--color-bubble);
    color: var(--color-text);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-ui);
  }
  h2 {
    margin: 0;
    color: var(--color-text-quiet);
    font-size: max(16px, calc(16 * var(--u)));
    font-weight: 700;
  }
  .close {
    margin: 0;
    padding: 0;
    width: max(44px, calc(44 * var(--u)));
    height: max(44px, calc(44 * var(--u)));
    border: none;
    background: none;
    color: var(--color-text);
    cursor: pointer;
  }
  .close svg {
    width: 1em;
    height: 1em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.5;
    stroke-linecap: round;
  }
  .rows {
    margin: 0;
    padding: 0;
    list-style: none;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    align-content: start;
    gap: 0.5em;
  }
  /* Landscape: name left, line right. Portrait: the line under the name. */
  .rows li {
    display: grid;
    grid-template-columns: 6.5em 1fr;
    gap: 0.6em;
    align-items: start;
  }
  .rows .who {
    justify-self: start;
    padding: 0 0.4em;
    border-radius: var(--radius-control);
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, calc(16 * var(--u)));
    font-weight: 700;
    line-height: calc(28 * var(--u));
  }
  /* Only your own lines' names take your colour. */
  .rows li[data-mine='true'] .who {
    background: var(--color-mine-current);
    color: var(--color-mine-text);
  }
  .rows .notice {
    display: block;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, calc(16 * var(--u)));
  }
  .fit[data-orientation='portrait'] .rows li {
    grid-template-columns: 1fr;
    gap: 0;
  }
</style>
