<script lang="ts">
	import { Card, CardsGrid, Interactable, Layout, ThemeToggle } from '@pierogis/utensils';

	export let data;
</script>

<svelte:head>
	<title>pierogis live</title>
</svelte:head>

<Layout>
	<Interactable slot="title">
		<div class="link-box border inset">pierogis live</div>
	</Interactable>

	<h3 class="tagline">{data.tagline}</h3>

	<CardsGrid>
		<Interactable clickable={false}>
			<Card>
				<Interactable>
					<a class="border inset link-box" href="https://kitchen.pierogis.live">kitchen</a>
				</Interactable>
				<span>work on a recipe</span>
				<iframe title="kitchen" src="https://kitchen.pierogis.live" />
				<br />
			</Card>
		</Interactable>

		<Interactable clickable={false}>
			<Card>
				<Interactable>
					<a class="border inset link-box" href="https://emporium.pierogis.live">emporium</a>
				</Interactable>
				<span>a place for plates</span>
				<iframe title="emporium" src="https://emporium.pierogis.live" />
				<br />
			</Card>
		</Interactable>

		<Interactable clickable={false}>
			<Card>
				<Interactable>
					<a class="border inset link-box" href="https://colors.pierogis.live">colors</a>
				</Interactable>
				<span>refine your palette</span>
				<iframe title="colors" src="https://colors.pierogis.live" />
				<br />
			</Card>
		</Interactable>

		<Interactable clickable={false}>
			<Card>
				<Interactable>
					<a class="border inset link-box" href="https://utensils.pierogis.live">utensils</a>
				</Interactable>
				<span>some implements to aid consumption</span>
				<iframe title="utensils" src="https://utensils.pierogis.live" />
				<br />
			</Card>
		</Interactable>
	</CardsGrid>

	<br />

	<footer slot="footer">
		<Interactable>
			<a class="border inset link-box" href="https://careers.pierogis.live">careers</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://github.com/pierogis/live">github</a>
		</Interactable>
		<Interactable>
			<a class="border inset link-box" href="https://twitter.com/pierogis_live">@pierogis_live</a>
		</Interactable>
		<ThemeToggle />
	</footer>
</Layout>

<style>
	@import '@pierogis/utensils/styles/pierogis.css';

	.tagline {
		text-align: center;
		padding: 1rem;
	}
	iframe {
		max-width: 90%;
		width: 60rem;
		height: 30rem;

		padding: 0.4rem;

		border: dashed var(--text-color) 1px;
		border-radius: 1rem;
	}
</style>
