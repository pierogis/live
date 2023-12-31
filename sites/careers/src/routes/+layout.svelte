<script lang="ts">
	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';
</script>

<ThemeProvider>
	<Layout title="careers" github="https://github.com/pierogis/live/tree/main/sites/careers">
		<slot />
	</Layout>
</ThemeProvider>
