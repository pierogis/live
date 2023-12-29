<script lang="ts">
	import { Interactable, Layout, ThemeToggle } from '@pierogis/utensils';
	import '@pierogis/utensils/styles/pierogis.css';
</script>

<svelte:head>
	<title>careers</title>
</svelte:head>

<Layout>
	<Interactable slot="title">
		<div class="link-box border inset">careers</div>
	</Interactable>

	<slot />

	<footer slot="footer">
		<Interactable>
			<a class="border inset link-box" href="https://pierogis.live">live</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://github.com/pierogis/careers">github</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://twitter.com/pierogis_live"> @pierogis_live </a>
		</Interactable>

		<ThemeToggle />
	</footer>
</Layout>
