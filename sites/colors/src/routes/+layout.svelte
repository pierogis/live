<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/state';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';

	let { children } = $props();

	if (browser) {
		injectSpeedInsights();
	}
</script>

<svelte:head>
	<title>{page.data.title}</title>
	<link rel="canonical" href={page.data.canonical} />
	<meta name="description" content={page.data.description} />
	<meta name="robots" content="index, follow" />
</svelte:head>

<ThemeProvider>
	<Layout
		title="colors"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/colors' }}
	>
		{@render children()}
	</Layout>
</ThemeProvider>
