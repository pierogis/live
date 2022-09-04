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
			<a class="border shadow inset link-box" href="https://emporium.pierogis.live">emporium</a>
			<span>a place for plates</span>
			<iframe title="emporium" src="https://emporium.pierogis.live" />
		</Card>
		<Card>
			<a class="border shadow inset link-box" href="https://kitchen.pierogis.live">kitchen</a>
			<span>work on a recipe</span>
			<iframe title="kitchen" src="https://kitchen.pierogis.live" />
		</Card>
		<Card>
			<a class="border shadow inset link-box" href="https://colors.pierogis.live">colors</a>
			<span>refine your palette</span>
			<iframe title="colors" src="https://colors.pierogis.live" />
		</Card>
		<Card>
			<a class="border shadow inset link-box" href="https://utensils.pierogis.live">utensils</a>
			<span>some implements to aid consumption</span>
			<iframe title="utensils" src="https://utensils.pierogis.live" />
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
		width: 60rem;
		height: 30rem;

		padding: 0.4rem;

		border: dashed grey 1px;
		border-radius: 8px;
	}
</style>
