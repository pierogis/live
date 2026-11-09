<script lang="ts">
	import { Interactable } from '@pierogis/utensils';

	import { OTHER } from '#lib/sites.js';
</script>

<h3 class="tagline">other places</h3>

<ul>
	{#each OTHER as site (site.href)}
		<li>
			<Interactable>
				<a class="border inset link-box" href={site.href}>{site.title}</a>
			</Interactable>
			<span>{site.tagline}</span>
		</li>
	{/each}
</ul>

<style>
	.tagline {
		margin: 0;
		text-align: center;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem 1rem;
		align-items: center;
	}
	li {
		display: grid;
		grid-column: span 2;
		grid-template-columns: subgrid;
		align-items: center;
	}
	li > :global(*:first-child) {
		justify-self: start;
	}
</style>
