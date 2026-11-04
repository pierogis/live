import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';

import { mosaicLevels } from './scripts/mosaic-levels-plugin.ts';

export default defineConfig({
	plugins: [mosaicLevels(), sveltekit({ preprocess: vitePreprocess(), adapter: adapter() })]
});
