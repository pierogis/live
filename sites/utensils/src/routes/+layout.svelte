<script lang="ts">
	import { page } from '$app/state';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	let { children } = $props();

	let title = $derived(page.data.title || 'utensils');
	let description = $derived(page.data.description || 'a demonstration of table manners');
	let canonical = $derived(new URL(page.url.pathname, 'https://utensils.pierogis.live').toString());
	let og = $derived({
		image: new URL(`pierogis-live-og.webp`, page.url.origin).toString(),
		alt: 'pierogis live'
	});
	let twitter = $derived({
		card: 'summary_large_image' as const,
		image: new URL(`pierogis-live-twitter.webp`, page.url.origin).toString(),
		alt: 'pierogis live'
	});
</script>

<SEO {title} {description} {canonical} type="website" {og} {twitter} />

<ThemeProvider>
	<Layout
		title="utensils"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/utensils' }}
	>
		{@render children?.()}
	</Layout>
</ThemeProvider>
