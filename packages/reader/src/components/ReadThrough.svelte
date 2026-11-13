<!--
  Chat-style read-through, one scene of a work.
  Lines appear as bubbles as they are read: lines of the roles you read on the right, others on
  the left, each with the speaker's icon and name. Stage directions span the column without a
  speaker; a scene heading sits centred above the line that opens the scene. In the footer,
  right under the newest line, every player sees the advance button: active for whoever reads
  now, greyed for the others. On the last line it says it ends the work, or moves on when another scene follows.
-->
<script lang="ts">
  import { currentLine, type DialogueProgress, parseRuby, readerOf } from '@uzu-toolkit/kit';
  import type { Line, Scenario } from '../script';
  import { sceneIn, sceneOut } from './motion';
  import FooterActions from './FooterActions.svelte';
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
    /** Your tap on the advance button, with the line you were looking at (the action's payload). */
    onadvance: (index: number) => void;
    /** True when the last line ends the work; false when another scene follows. */
    final?: boolean;
  } = $props();

  const LINES = $derived(scenario.script.lines);
  // The roles you read: several when your part doubles roles.
  const myRoles = $derived(scenario.rolesOf(myPart));
  const isMine = (l: Line): boolean => myRoles.includes(readerOf(l));
  const line = $derived(currentLine(LINES, progress));
  const mine = $derived(!!line && isMine(line));
  // On the last line the button ends the read-through, so it says so instead of the next mark.
  const last = $derived(!!line && progress.index === LINES.length - 1);
  const shown = $derived(LINES.slice(0, progress.index + 1));

  let chat: HTMLOListElement | undefined = $state();
  // Set by push(), which scrolls before it moves the lines; scrolling again mid-push would
  // follow the moving lines and cancel the motion.
  let pushed = false;
  // Where the newest line stood on screen just before the next one came in, so push() can move
  // the earlier lines on from there.
  let before: number | undefined;
  const count = $derived(shown.length);
  $effect.pre(() => {
    void count;
    before = chat?.lastElementChild?.getBoundingClientRect().top;
  });
  // Keep the newest line in view as lines are added.
  $effect(() => {
    void count;
    if (pushed) pushed = false;
    else if (chat?.lastElementChild) follow(chat, chat.lastElementChild as HTMLElement);
  });

  /**
   * Scroll the list to its newest line: to the end, or, when the line is taller than the list,
   * to the line's top, so its reader starts at its first words and sees whose line it is.
   */
  function follow(list: HTMLElement, line: HTMLElement): void {
    const top = line.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop;
    list.scrollTo({ top: line.offsetHeight > list.clientHeight ? top : list.scrollHeight });
  }

  const reduceMotion = (): boolean => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * A new line enters at full size from below and pushes the earlier lines up.
   * Opacity and transform only, 200 ms ease-out (docs/design.md, Motion).
   */
  function push(node: HTMLElement) {
    const list = node.parentElement;
    const prev = node.previousElementSibling;
    if (!list || !prev || before === undefined || reduceMotion()) return {};
    pushed = true;
    for (const li of list.children) li.getAnimations().forEach((a) => a.cancel());
    follow(list, node);
    // Every line moves by the same amount: from where the previous newest line stood (mid-push
    // included) to where it stands now.
    const shift = before - prev.getBoundingClientRect().top;
    for (const li of list.children) {
      li.animate([{ transform: `translateY(${shift}px)` }, { transform: 'none' }], {
        duration: 200,
        easing: 'cubic-bezier(0, 0, 0.2, 1)',
      });
    }
    return {};
  }

  /**
   * A wrapped bubble keeps the width it had before wrapping, which leaves a gap at the right of
   * every line. Shrink it to its longest line: measure the text's line boxes and set the width.
   */
  function fit(node: HTMLElement) {
    const text = node.firstElementChild as HTMLElement;
    const measure = () => {
      node.style.width = '';
      // One rect per line, or several where ruby splits a line: span them all.
      const rects = [...text.getClientRects()];
      const widest = Math.max(...rects.map((r) => r.right)) - Math.min(...rects.map((r) => r.left));
      node.style.width = `${Math.ceil(widest)}px`;
    };
    measure();
    // Measure again once the bundled fonts are in; the fallback face sets different widths.
    document.fonts.ready.then(measure);
    addEventListener('resize', measure);
    return { destroy: () => removeEventListener('resize', measure) };
  }

  function advance(): void {
    if (mine) onadvance(progress.index);
  }
</script>

{#snippet text(t: string)}{#each parseRuby(t) as seg}{#if seg.ruby}<span class="rb">{seg.text}<span class="rt">{seg.ruby}</span></span>{:else}{seg.text}{/if}{/each}{/snippet}

<div class="read" in:sceneIn|global out:sceneOut|global>
  <ol class="chat" data-uzu-scroll bind:this={chat}>
    {#if scenario.script.notice}<li class="notice"><span>{scenario.script.notice}</span></li>{/if}
    {#each shown as l, i}
      <li
        in:push
        data-side={isMine(l) ? 'right' : 'left'}
        data-current={i === progress.index}
        data-direction={scenario.isDirection(l)}
      >
        {#if l.scene}<h3>{l.scene}</h3>{/if}
        <div class="row">
          {#if !scenario.isDirection(l) && !l.cont}
            <img src={`./assets/icon-${readerOf(l)}.webp`} alt={scenario.nameOf(l, STRINGS['name.and'])} />
            <span class="name">{scenario.nameOf(l, STRINGS['name.and'])}</span>
          {/if}
          {#if scenario.isDirection(l)}
            <p>{@render text(l.text)}</p>
          {:else}
            <p use:fit><span>{@render text(l.text)}</span></p>
          {/if}
        </div>
      </li>
    {/each}
  </ol>
</div>
<!-- In the footer, right under the newest line, for every player: active for the reader, greyed for the others. -->
<FooterActions>
  <NextButton disabled={!mine} note={mine ? undefined : STRINGS['status.theirTurn']} onclick={advance}>
    {#if last}{STRINGS[final ? 'button.end' : 'button.nextPhase']}{:else}<svg viewBox="0 0 10 8" aria-hidden="true"><path d="M0 0h10L5 8z" /></svg>{STRINGS['button.nextLine']}{/if}
  </NextButton>
</FooterActions>

<style>
  /* The chat, down to the footer that holds the button for your turn. */
  .read {
    align-self: end;
    /* A reading width, so the eye does not cross a wide landscape screen between lines. */
    justify-self: stretch;
    width: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.6em;
  }
  .chat {
    min-height: 0;
    margin: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    /* Lines sit at the bottom. Once they overflow, `safe` starts them at the top instead, since
       overflow past the top of a scroll box cannot be scrolled to. */
    justify-content: safe flex-end;
    gap: 0.45em;
    /* Older lines scroll up; the list keeps the newest line in view. It spans the whole screen so
       its scrollbar sits at the screen's right edge; the lines keep the reading width. */
    padding-inline: max(0px, calc((100% - 30em) / 2));
    overflow-y: auto;
  }
  /* One line, with the heading of the scene it opens above it. */
  li {
    display: flex;
    flex-direction: column;
    gap: 0.45em;
  }
  /* The speaker's icon and name on one row, the bubble under them. */
  .row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 0.15em 0.35em;
    max-width: 90%;
  }
  li[data-side='right'] .row {
    grid-template-columns: 1fr auto;
    align-self: flex-end;
  }
  /* Stage directions are no one's speech: the full column, no icon or name. */
  li[data-direction='true'] .row {
    max-width: none;
    align-self: stretch;
  }
  /* Stage directions are narration, not speech: no bubble. While you read one, a line in the
     advance button's colour stands at each side of it. The lines are always there, uncoloured,
     so colouring them never moves the text. */
  li[data-direction='true'][data-current][data-side] p {
    background: none;
    color: var(--color-text);
    border-inline: 0.2em solid transparent;
    border-radius: 0;
  }
  li[data-direction='true'][data-current='true'][data-side='right'] p {
    border-inline-color: var(--color-mine-current);
  }
  /* The work's note on itself, above the first line: an aside, not story, so UI text in the
     quieter colour, set apart from the lines by space. */
  .notice {
    display: block;
    /* On the left edge of the stage directions' text (their padding and side line, in the
       line's em); extra room below sets it apart. */
    padding: 0 0.9em 0.35em;
  }
  .notice span {
    display: block;
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    font-size: max(16px, 0.75em);
    line-height: 1.6;
  }
  /* A scene heading stands for what follows, so it is centred. */
  h3 {
    margin: 0;
    padding-top: 0.4em;
    align-self: center;
    color: var(--color-text-quiet);
    font-weight: 400;
    font-size: 1em;
  }
  img {
    grid-area: 1 / 1;
    width: 1.3em;
    height: 1.3em;
    border-radius: 50%;
    object-fit: cover;
  }
  li[data-side='right'] img {
    grid-column: 2;
  }
  /* Who speaks, by name: side and icon alone are not enough to tell roles apart. */
  .name {
    color: var(--color-text-quiet);
    font-family: var(--font-ui);
    /* No text below 16px. */
    font-size: max(16px, 0.75em);
  }
  li[data-side='right'] .name {
    grid-column: 1;
    justify-self: end;
  }
  li p {
    grid-column: 1 / -1;
    justify-self: start;
    margin: 0;
    /* Keep bubbles tight: padding here costs a lot of room on a phone. */
    padding: 0.35em 0.7em;
    border-radius: var(--radius-read);
    /* Break between phrases, never mid-word. */
    word-break: auto-phrase;
    background: var(--color-bubble);
  }
  /* Room above each line for ruby. */
  li p:has(.rb) {
    line-height: 1.9;
  }
  /* Ruby gives the reading of the word under it: half size, the one text below 16px. It may run
     past its word rather than spread the word's letters apart (which <ruby> does in Chrome). */
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
  /* The corner under the speaker is square, pointing to who speaks; a continuing line has none. */
  .name + p {
    border-top-left-radius: 0;
  }
  li[data-side='right'] .name + p {
    border-top-left-radius: var(--radius-read);
    border-top-right-radius: 0;
  }
  li[data-direction='true'] p {
    justify-self: stretch;
  }
  /* Your role's lines, as in chat apps. */
  li[data-side='right'] p {
    justify-self: end;
    background: var(--color-bubble-mine);
  }
  /* Your line being read now matches the advance button. The other role's lines stay white. */
  li[data-current='true'][data-side='right'] p {
    background: var(--color-mine-current);
    color: var(--color-mine-text);
  }
</style>
