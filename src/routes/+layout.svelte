<script lang="ts">
	import { Layout, ThemeToggle } from '$lib';
</script>

<Layout title="utensils">
	<br slot="nav" />

	<slot />

	<br />
	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://pierogis.live">live</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/utensils">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<ThemeToggle />
	</footer>
</Layout>
