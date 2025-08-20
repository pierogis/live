import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
	output: 'static',
	integrations: [svelte(), mdx(), sitemap()],
	site: 'https://stale.pierogis.live',
	adapter: cloudflare()
});
