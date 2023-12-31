<script lang="ts">
	import { ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';
</script>

<ThemeProvider>
	<Layout title="pierogis live" github="https://github.com/pierogis/live">
		<slot />
	</Layout>
</ThemeProvider>
