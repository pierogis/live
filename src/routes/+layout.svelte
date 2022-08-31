<script lang="ts">
	import { Layout, ThemeToggle } from '@pierogis/utensils';
</script>

<Layout title="careers">
	<slot />

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/careers">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<ThemeToggle />
	</footer>
</Layout>
