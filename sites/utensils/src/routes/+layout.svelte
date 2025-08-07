<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	if (browser) {
		injectSpeedInsights();
	}

	$: title = $page.data.title || 'utensils';
	$: description = $page.data.description || 'a demonstration of table manners';
	$: canonical = new URL($page.url.pathname, 'https://utensils.pierogis.live').toString();
	$: og = {
		image: new URL(`pierogis-live-og.webp`, $page.url.origin).toString(),
		alt: 'pierogis live'
	};
	$: twitter = {
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, $page.url.origin).toString(),
		alt: 'pierogis live'
	};
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter} />

<ThemeProvider>
	<Layout
		title="utensils"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/utensils' }}
	>
		<slot />
	</Layout>
</ThemeProvider>
