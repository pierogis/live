<script lang="ts">
	import { Layout, ThemeToggle } from '$lib';
</script>

<Layout title="utensils">
	<br slot="nav" />

	<slot />

	<br />
	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<ThemeToggle />
	</footer>
</Layout>

<style>
</style>
