import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  // Certification: load assets by relative path.
  base: './',
  plugins: [svelte()],
  server: { host: true, cors: true },
};
