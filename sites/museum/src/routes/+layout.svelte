<script lang="ts">
	import { page } from '$app/state';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	let { children } = $props();

	let canonical = $derived(`https://museum.pierogis.live${page.url.pathname.replace(/\/$/, '')}`);
</script>

<svelte:head>
	{#if page.error}
		<title>{page.error.message.toLowerCase()} · museum</title>
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>
{#if !page.error}
	<SEO title={page.data.title} description={page.data.description} {canonical} type="website" />
{/if}

<ThemeProvider>
	<Layout
		title="museum"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/museum' }}
	>
		{@render children?.()}
	</Layout>
</ThemeProvider>
