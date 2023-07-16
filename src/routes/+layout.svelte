<script lang="ts">
	import { Interactable, Layout, ThemeToggle } from '@pierogis/utensils';
</script>

<svelte:head>
	<title>colors</title>
</svelte:head>

<Layout>
	<Interactable>
		<div class="link-box border inset">colors</div>
	</Interactable>

	<slot />

	<footer slot="footer">
		<Interactable>
			<a class="border inset link-box" href="https://pierogis.live">live</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://github.com/pierogis/colors">github</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://twitter.com/pierogis_live">@pierogis_live</a>
		</Interactable>

		<ThemeToggle />
	</footer>
</Layout>

<style>
	@import '@pierogis/utensils/styles/pierogis.css';
</style>
