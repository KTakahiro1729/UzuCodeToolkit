// Plays every seat through every phase of a work in the UZU dev harness, then checks that no
// player's screen recorded a prediction warning (a plain action that read the clock or a random
// number, which would drift online). Needs Playwright (as tools/screen-preview does).
// Usage, in a test: `await allPhases({ phases: work.phases, drive: { intro: ready, opening: readThrough(opening) } })`.
// Phases not named in `drive` are moved on by the first seat sending `next`. `away: 'part'` plays the same with that seat gone. Types: all-phases.d.mts.
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const WINDOWS = process.platform === 'win32';
const running = new Set();

/**
 * Stops the child and everything it started. `npx` and the shell are only wrappers; the servers are
 * further down, and `uzu dev` starts vite in a session of its own, so only `uzu dev` itself can stop
 * it: ask it to quit (SIGTERM) before forcing anything. On Windows `taskkill /T` walks the tree.
 */
const killTree = (child, signal = 'SIGTERM') => {
  running.delete(child);
  if (child.pid === undefined) return;
  try {
    if (WINDOWS) spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' });
    else process.kill(-child.pid, signal); // the child leads its own group (detached)
  } catch {
    // already gone
  }
};

/** Asks the tree to quit and waits for it, forcing it after a few seconds. */
const stopTree = async (child) => {
  killTree(child);
  if (WINDOWS || child.exitCode !== null) return;
  const gone = new Promise((done) => child.once('exit', done));
  await Promise.race([gone, new Promise((done) => setTimeout(done, 5000))]);
  killTree(child, 'SIGKILL');
};

// The finally below does not run when the test process is stopped (Ctrl+C, a test runner that
// ends its worker): kill what is still running on the way out. Only SIGKILL cannot be caught.
process.on('exit', () => running.forEach(killTree));
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    running.forEach(killTree);
    process.exit(1);
  });
}

// What the handlers above cannot cover: the test process killed outright (SIGKILL, a runner that
// force-ends its worker, a closed terminal window on Windows). A small process of its own watches
// for the parent to go, then kills the tree. It leaves when the tree is gone.
const WATCHER = `
const [child, windows] = process.argv.slice(1).map(Number);
process.stdin.resume();
process.stdin.on('end', () => {
  try {
    if (windows) require('node:child_process').spawnSync('taskkill', ['/T', '/F', '/PID', String(child)], { stdio: 'ignore' });
    else {
      process.kill(-child, 'SIGTERM');
      setTimeout(() => { try { process.kill(-child, 'SIGKILL'); } catch {} }, 3000);
    }
  } catch {}
});
`;
// The pipe from the test process ends when that process does, however it ends.
const watch = (child) => {
  if (child.pid === undefined) return;
  const watcher = spawn(process.execPath, ['-e', WATCHER, child.pid, WINDOWS ? 1 : 0], { detached: !WINDOWS, stdio: ['pipe', 'ignore', 'ignore'], windowsHide: true });
  watcher.unref();
  watcher.stdin.unref();
};

/** Every seat says it is ready (readyPhase). */
export const ready = async ({ seats, send }) => {
  for (const seat of seats) await send(seat, 'ready');
};

/** Each line is advanced, in order, by the seat whose part reads its speaker (readThroughPhase). */
export const readThrough = (script) => async ({ seats, send }) => {
  const parts = script.parts ?? script.cast.map((c) => ({ id: c.id, roles: [c.id] }));
  const reader = (line) => {
    const role = typeof line.speaker === 'string' ? line.speaker : line.speaker[0];
    const part = parts.find((p) => p.roles.includes(role));
    return seats.find((s) => s.part === part?.id) ?? seats[0];
  };
  for (const [index, line] of script.lines.entries()) await send(reader(line), 'advance', { index });
};

/** Each seat fills in its required settings, then says it is done (handoutLogic). */
export const handout = (handouts) => async ({ seats, send }) => {
  for (const seat of seats) {
    for (const s of handouts.parts[seat.part]?.settings ?? []) {
      if (!s.optional) await send(seat, 'set', { id: s.id, value: 'x' });
    }
    await send(seat, 'ready');
  }
};

const next = async ({ seats, send }) => send(seats[0], 'next');

/**
 * @param {object} o
 * @param {readonly { id: string }[]} o.phases The work's phases, in order (script/work.json).
 * @param {Record<string, Function>} [o.drive] How to play a phase, by phase ID.
 * @param {string} [o.cwd] The work's folder (default: the current one).
 * @param {number} [o.stepTimeoutMs] How long one action may take to show in the state.
 * @param {string | readonly string[]} [o.away] Part(s) whose seat has left: it never acts, and the drivers get no seat for it.
 *   Every phase must still end without it (a work where one player's leaving strands the others fails with the phase's ID).
 */
export async function allPhases({ phases, drive = {}, cwd = process.cwd(), stepTimeoutMs = 5000, away = [] }) {
  const gone = new Set([away].flat());
  const { chromium } = createRequire(resolve(cwd, 'package.json'))('playwright');
  // Not detached on Windows: there the whole tree is killed by taskkill, and a detached child gets a console of its own.
  const dev = spawn('npx', ['uzu', 'dev'], { cwd, detached: !WINDOWS, stdio: ['ignore', 'pipe', 'inherit'], shell: WINDOWS });
  running.add(dev);
  watch(dev);
  let browser;
  let startTimer;
  try {
    const url = await new Promise((done, fail) => {
      let log = '';
      dev.stdout.on('data', (d) => {
        log += d;
        const m = /UZU dev harness: (http:\/\/localhost:\d+)/.exec(log);
        if (m) done(m[1]);
      });
      dev.once('exit', () => fail(new Error(`uzu dev exited early:\n${log}`)));
      startTimer = setTimeout(() => fail(new Error(`uzu dev did not start:\n${log}`)), 60_000);
    });
    clearTimeout(startTimer);
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForFunction(() => window.__uzu_dev && document.querySelectorAll('iframe').length > 0);

    // A seat's frame, looked up afresh: the harness may reload it.
    const frameOf = (i) => page.frames().find((f) => f.parentFrame() === page.mainFrame() && new URL(f.url()).searchParams.get('__dev_player') === String(i));
    const count = await page.evaluate(() => document.querySelectorAll('iframe').length);
    // The state is read from seat 0's screen: the harness page's own snapshot stays null until something changes.
    const snapshot = () => frameOf(0).evaluate(() => window.__uzu_dev.getSnapshot());
    await frameOf(0).waitForFunction(() => window.__uzu_dev?.getSnapshot() != null);
    // Seat ID -> its frame's number (the frame's own player ID).
    const index = {};
    for (let i = 0; i < count; i++) {
      const f = frameOf(i);
      await f.waitForFunction(() => window.__uzu_dev?.playerId() && window.__flow_dev);
      index[await f.evaluate(() => window.__uzu_dev.playerId())] = i;
    }

    const change = (prev, ms) =>
      frameOf(0).evaluate(([prev, ms]) => window.__uzu_dev.waitForSnapshot((s) => JSON.stringify(s) !== prev, { timeoutMs: ms }), [prev, ms]);

    for (let guard = 0; !(await snapshot()).ended; guard++) {
      const snap = await snapshot();
      const id = phases[snap.at].id;
      if (guard > phases.length * 4) throw new Error(`stuck in phase ${id}`);
      const seats = Object.keys(snap.parts).map((s) => ({ id: s, part: snap.parts[s] })).filter((s) => !gone.has(s.part));
      if (!seats.length) throw new Error('every seat is away');
      // The action goes in from the seat's own screen, so the client predicts it as a player's tap would.
      const send = async (seat, name, payload = {}) => {
        const prev = JSON.stringify(await snapshot());
        await frameOf(index[seat.id]).evaluate(([t, p]) => window.__flow_dev.send(t, p), [`${id}:${name}`, payload]);
        await change(prev, stepTimeoutMs).catch(() => {
          throw new Error(`phase ${id}: ${name} from ${seat.part} changed nothing (rejected?)${gone.size ? `, with ${[...gone].join(', ')} away` : ''}`);
        });
      };
      await (drive[id] ?? next)({ seats, send, phase: snap.phases[id] });
      const after = await snapshot();
      if (after.at === snap.at && !after.ended)
        throw new Error(gone.size ? `phase ${id} did not finish with ${[...gone].join(', ')} away: the others cannot move it on` : `phase ${id} did not finish`);
    }

    const warnings = [];
    for (let i = 0; i < count; i++) warnings.push(...(await frameOf(i).evaluate(() => window.__uzu_dev.getPredictionWarnings())));
    const unique = [...new Map(warnings.map((w) => [`${w.action}/${w.api}`, w])).values()];
    if (unique.length) throw new Error(`prediction warnings (read the clock or a random number in a plain action): ${JSON.stringify(unique)}`);
  } finally {
    clearTimeout(startTimer);
    await browser?.close().catch(() => {});
    await stopTree(dev);
  }
}
