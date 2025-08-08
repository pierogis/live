import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	integrations: [svelte(), mdx(), sitemap()],
	site: 'https://stale.pierogis.live',
	adapter: vercel()
});
