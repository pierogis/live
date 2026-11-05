import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

import { levelsPlugin } from './scripts/levels-plugin.ts';

export default defineConfig({
	plugins: [levelsPlugin(), sveltekit({ preprocess: vitePreprocess(), adapter: adapter() })]
});
