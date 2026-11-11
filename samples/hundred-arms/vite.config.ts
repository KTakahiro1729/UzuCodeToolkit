import { svelte } from '@sveltejs/vite-plugin-svelte';
import { devHarness } from './dev-harness.ts';

export default {
  // Certification: load assets by relative path.
  base: './',
  plugins: [svelte(), devHarness()],
  server: { host: true, cors: true },
};
