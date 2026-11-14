import { svelte } from '@sveltejs/vite-plugin-svelte';
import { devHarness } from '@uzu-toolkit/reader/dev-harness';

export default {
  // Certification: load assets by relative path.
  base: './',
  plugins: [svelte(), devHarness()],
  server: { host: true, cors: true },
  // Node refuses TypeScript under node_modules, so the toolkit's sources go through vite too.
  test: { server: { deps: { inline: [/@uzu-toolkit/] } }, include: ['test/**/*.test.ts'] },
};
