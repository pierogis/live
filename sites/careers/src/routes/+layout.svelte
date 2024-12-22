<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	$: browser && injectSpeedInsights();

	$: title = $page.data.title || 'careers';
	$: description = $page.data.description || 'a good place to start working with pierogis';
	$: canonical = new URL($page.url.pathname, 'https://careers.pierogis.live').toString();
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
		title="careers"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/careers' }}
	>
		<slot />
	</Layout>
</ThemeProvider>
