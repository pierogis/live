import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

import { levelLists } from './scripts/level-lists.ts';

export default defineConfig({
	plugins: [levelLists(), sveltekit({ preprocess: vitePreprocess(), adapter: adapter() })]
});
