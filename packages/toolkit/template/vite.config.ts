import { svelte } from '@sveltejs/vite-plugin-svelte';
import { devHarness } from '@uzu-toolkit/reader/dev-harness';

export default {
  // Certification: load assets by relative path.
  base: './',
  plugins: [svelte(), devHarness()],
  server: { host: true, cors: true },
  // The toolkit's Svelte sources (.svelte, .svelte.ts) are compiled by the svelte plugin; vite's pre-bundling cannot read them.
  optimizeDeps: { exclude: ['@uzu-toolkit/reader', '@uzu-toolkit/kit'] },
  // Node refuses TypeScript under node_modules, so the toolkit's sources go through vite too.
  test: { server: { deps: { inline: [/@uzu-toolkit/] } }, include: ['test/**/*.test.ts'] },
};
