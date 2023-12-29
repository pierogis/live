<script lang="ts">
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

	import { browser } from '$app/environment';

	import { Card, CardsGrid, Interactable, Layout, ThemeToggle } from '@pierogis/utensils';
	import '@pierogis/utensils/styles/pierogis.css';

	export let data;

	$: browser && injectSpeedInsights();
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
