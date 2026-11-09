<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	import { MAIN } from '#lib/sites.js';

	let { data } = $props();
</script>

<h3 class="tagline">{data.tagline}</h3>

<div class="sites">
	{#each MAIN as site (site.href)}
		<Card>
			<!-- The name below is the link for keyboards and screen readers; the symbol is a bigger target. -->
			<a href={site.href} tabindex="-1" aria-hidden="true">
				<img src="/symbols/{site.title}.svg" alt="" width="112" height="112" />
			</a>
			<Interactable>
				<a class="border inset link-box" href={site.href}>{site.title}</a>
			</Interactable>
			<p>{site.tagline}</p>
		</Card>
	{/each}
</div>

<style>
	.tagline {
		margin: 0;
		text-align: center;
	}
	.sites {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		width: 100%;
		max-width: 800px;
	}
	img {
		display: block;
	}
	p {
		margin: 0;
	}
</style>
