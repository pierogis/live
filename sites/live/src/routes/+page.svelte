<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';

	import { Card, CardsGrid, Interactable } from '@pierogis/utensils';

	export let data;

	$: browser && injectSpeedInsights();
</script>

<h3 class="tagline">{data.tagline}</h3>

<CardsGrid>
	{#each data.sites as site}
		<Interactable clickable={false}>
			<Card>
				<Interactable>
					<a class="border inset link-box" href={site.href}>{site.tagline}</a>
				</Interactable>
				<iframe title={site.title} src={site.href} />
				<br />
			</Card>
		</Interactable>
	{/each}
</CardsGrid>

<style>
	.tagline {
		margin: 0;
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
