import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

import { levelLists } from './scripts/level-lists.ts';
import { levelsPlugin } from './scripts/levels-plugin.ts';

export default defineConfig({
	plugins: [
		levelsPlugin(),
		levelLists(),
		sveltekit({ preprocess: vitePreprocess(), adapter: adapter() })
	],
	// The editor's check workers are ES modules ({ type: 'module' }).
	worker: { format: 'es' }
});
