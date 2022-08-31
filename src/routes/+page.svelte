<script lang="ts">
	import { Card, CardsGrid, Layout, ThemeToggle } from '@pierogis/utensils';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ tagline } = data);
</script>

<Layout title="pierogis live">
	<br />
	<h3 class="tagline">{tagline}</h3>
	<br />
	<CardsGrid>
		<Card>
			<iframe title="emporium" src="https://emporium.pierogis.live" />
			<span>a place for plates</span>
			<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
		</Card>
		<Card>
			<iframe title="kitchen" src="https://kitchen.pierogis.live" />
			<span>work on a recipe</span>
			<a class="border shadow inset link-box" href="https://kitchen.pierogis.live">kitchen</a>
		</Card>
		<Card>
			<iframe title="colors" src="https://colors.pierogis.live" />
			<span>refine your palette</span>
			<a class="border shadow inset link-box" href="https://colors.pierogis.live">colors</a>
		</Card>
		<Card>
			<iframe title="utensils" src="https://utensils.pierogis.live" />
			<span>some implements to aid consumption</span>
			<a class="border shadow inset link-box" href="https://utensils.pierogis.live">utensils</a>
		</Card>
	</CardsGrid>

	<footer slot="footer">
		<a class="border shadow inset link-box" href="https://careers.pierogis.live">careers</a>
		<a class="border shadow inset link-box" href="https://github.com/pierogis/live">github</a>
		<a class="border shadow inset link-box" href="https://twitter.com/pierogis_live">
			@pierogis_live
		</a>
		<ThemeToggle />
	</footer>
</Layout>

<style>
	.tagline {
		text-align: center;
		padding: 0.5rem;
	}
	iframe {
		max-width: 90%;
		width: 800px;
		height: 400px;

		padding: 0.4rem;

		border: dashed grey 1px;
		border-radius: 8px;
	}
</style>
