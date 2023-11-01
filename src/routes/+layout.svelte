<script lang="ts">
	import { Interactable, Layout, ThemeToggle } from '$lib';
</script>

<svelte:head>
	<title>utensils</title>
</svelte:head>

<Layout>
	<Interactable slot="title">
		<div class="link-box border inset">utensils</div>
	</Interactable>

	<br slot="nav" />

	<slot />

	<br />
	<footer slot="footer">
		<Interactable>
			<a class="border inset link-box" href="https://pierogis.live">live</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://github.com/pierogis/utensils">github</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://twitter.com/pierogis_live">@pierogis_live</a>
		</Interactable>

		<ThemeToggle />
	</footer>
</Layout>

<style>
	@import '$lib/styles/pierogis.css';
</style>
