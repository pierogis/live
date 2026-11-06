<script lang="ts">
	import { page } from '$app/state';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout, SEO } from 'ui';

	let { children } = $props();

	// No trailing slash, so the home page is the bare origin.
	let canonical = $derived(`https://parlor.pierogis.live${page.url.pathname.replace(/\/$/, '')}`);
</script>

<svelte:head>
	{#if page.error}
		<title>{page.error.message.toLowerCase()} · parlor</title>
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>
<!-- No canonical link on an error page: it isn't a page of the site. -->
{#if !page.error}
	<SEO title={page.data.title} description={page.data.description} {canonical} type="website" />
{/if}

<ThemeProvider>
	<Layout
		title="parlor"
		github={{ repo: 'https://github.com/pierogis/live/tree/main/sites/parlor' }}
	>
		{@render children?.()}
	</Layout>
</ThemeProvider>
