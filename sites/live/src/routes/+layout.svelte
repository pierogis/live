<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	let { children } = $props();

	if (browser) {
		injectSpeedInsights();
	}

	let title = $derived($page.data.title || 'pierogis live');
	let description = $derived($page.data.description || 'a basecamp for pierogis');
	let canonical = $derived(new URL($page.url.pathname, 'https://pierogis.live').toString());
	let og = $derived({
		image: new URL(`pierogis-live-og.webp`, $page.url.origin).toString(),
		alt: 'LeagueBrain'
	});
	let twitter = $derived({
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, $page.url.origin).toString(),
		alt: 'LeagueBrain'
	});
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter}></SEO>

<ThemeProvider>
	<Layout title="pierogis live" github={{ repo: 'https://github.com/pierogis/live' }}>
    	{@render children()}

    	{#snippet footer()}
    		<Interactable>
    			<a class="border inset link-box" href="https://careers.pierogis.live">careers</a>
    		</Interactable>
    	{/snippet}
	</Layout>
</ThemeProvider>
