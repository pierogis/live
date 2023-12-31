<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';

	$: browser && injectSpeedInsights();
</script>

<svelte:head>
	<title>{$page.data.title}</title>
	<link rel="canonical" href={$page.data.canonical} />
	<meta name="description" content={$page.data.description} />
	<meta name="robots" content="index, follow" />
</svelte:head>

<ThemeProvider>
	<Layout title="pierogis live" github={{ repo: 'https://github.com/pierogis/live' }}>
		<slot />

		<Interactable slot="footer">
			<a class="border inset link-box" href="https://careers.pierogis.live">careers</a>
		</Interactable>
	</Layout>
</ThemeProvider>
