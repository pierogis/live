<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { browser } from '$app/environment';

	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';

	$: browser && injectSpeedInsights();
</script>

<ThemeProvider>
	<Layout title="utensils" github="https://github.com/pierogis/live/tree/main/sites/utensils">
		<slot />
	</Layout>
</ThemeProvider>
