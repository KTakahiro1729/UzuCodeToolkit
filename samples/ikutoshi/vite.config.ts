import { svelte } from '@sveltejs/vite-plugin-svelte';
import { devHarness } from '@uzu-toolkit/reader/dev-harness';
export default { base: './', plugins: [svelte(), devHarness()], server: { host: true, cors: true } };
