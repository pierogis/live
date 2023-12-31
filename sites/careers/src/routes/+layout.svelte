<script lang="ts">
	import { browser } from '$app/environment';
	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';
</script>

<ThemeProvider>
	<Layout
		title="careers"
		github="https://github.com/pierogis/live/tree/main/sites/careers"
		inject={browser}
	>
		<slot />
	</Layout>
</ThemeProvider>
