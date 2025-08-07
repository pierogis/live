<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	if (browser) {
		injectSpeedInsights();
	}

	$: title = $page.data.title || 'pierogis live';
	$: description = $page.data.description || 'a basecamp for pierogis';
	$: canonical = new URL($page.url.pathname, 'https://pierogis.live').toString();
	$: og = {
		image: new URL(`pierogis-live-og.webp`, $page.url.origin).toString(),
		alt: 'LeagueBrain'
	};
	$: twitter = {
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, $page.url.origin).toString(),
		alt: 'LeagueBrain'
	};
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter}></SEO>

<ThemeProvider>
	<Layout title="pierogis live" github={{ repo: 'https://github.com/pierogis/live' }}>
		<slot />

		<Interactable slot="footer">
			<a class="border inset link-box" href="https://careers.pierogis.live">careers</a>
		</Interactable>
	</Layout>
</ThemeProvider>
