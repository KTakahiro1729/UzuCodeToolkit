// Runs `uzu dev` in the current sample and restarts it whenever the server logic changes, so logic
// edits show up without a manual restart. Screen code (Svelte, CSS) needs no
// restart: vite swaps it in place. The /harness page (dev-harness.js) puts the
// game state back after a restart.
import { spawn, spawnSync } from 'node:child_process';
import { watch } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Run from a sample's folder. Everything its src/logic.ts imports: the sample's logic and
// script, and the reader and kit packages.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const WATCHED = [resolve('src/logic.ts'), resolve('script'), here('./src'), here('../kit/src')];
const WINDOWS = process.platform === 'win32';

let child = null;

const start = () => {
  child = spawn('npx', ['uzu', 'dev', ...process.argv.slice(2)], { stdio: 'inherit', shell: true, detached: !WINDOWS });
};

// Stop uzu dev together with the vite server it spawned.
const stop = () =>
  new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    child.once('exit', resolve);
    if (WINDOWS) spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' });
    else process.kill(-child.pid, 'SIGTERM');
  });

let timer;
const restart = () => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    console.log('\n[harness] Server logic changed. Restarting uzu dev...\n');
    await stop();
    start();
  }, 300);
};

for (const path of WATCHED) watch(path, { recursive: true }, restart);

// A closed terminal window sends SIGHUP; stop the servers then too, and on any other way out.
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, async () => {
    await stop();
    process.exit(0);
  });
}
process.on('exit', () => {
  if (!child || child.exitCode !== null) return;
  if (WINDOWS) spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' });
  else process.kill(-child.pid, 'SIGTERM');
});

start();
