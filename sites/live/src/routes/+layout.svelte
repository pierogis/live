<script lang="ts">
	import { browser } from '$app/environment';
	import { Interactable, ThemeProvider } from '@pierogis/utensils';
	import { Layout } from 'ui';
</script>

<ThemeProvider>
	<Layout title="pierogis live" github="https://github.com/pierogis/live" inject={browser}>
		<slot />

		<Interactable slot="footer">
			<a class="border inset link-box" href="https://careers.pierogis.live">careers</a>
		</Interactable>
	</Layout>
</ThemeProvider>
