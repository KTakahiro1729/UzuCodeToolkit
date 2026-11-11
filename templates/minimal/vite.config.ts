import { svelte } from '@sveltejs/vite-plugin-svelte';

export default {
  // 認証要件: アセットは相対パスで読む。
  base: './',
  plugins: [svelte()],
  server: { host: true, cors: true },
};
