<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	export let data;
</script>

<h3 class="tagline">{data.tagline}</h3>

<div class="grid">
	{#each data.sites as site}
		<div class="tile">
			<Card border={false} inset={false}>
				<Interactable>
					<a class="border inset link-box" href={site.href}>{site.tagline}</a>
				</Interactable>
				<iframe title={site.title} src={site.href} />
				<br />
			</Card>
		</div>
	{/each}
</div>

<style>
	.tagline {
		margin: 0;
		text-align: center;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 1rem;
	}
	.tile a {
		width: 100%;
		height: 100%;
	}

	.tile:nth-child(1) {
		grid-column: span 3;
	}

	.tile:nth-child(2) {
		grid-column: span 3;
	}

	.tile:nth-child(3) {
		grid-column: span 6;
	}

	.tile:nth-child(4) {
		grid-column: span 3;
	}

	.tile:nth-child(5) {
		grid-column: span 3;
	}

	.tile:only-child {
		grid-column: span 6;
	}

	.tile {
		grid-column: span 2;
	}

	@media screen and (max-width: 1200px) {
		.tile:nth-child(1),
		.tile {
			grid-column: span 3;
		}
	}

	@media screen and (max-width: 768px) {
		.grid {
			display: flex;
			flex-direction: column;
		}
	}

	iframe {
		max-width: 90%;
		width: 60rem;
		height: 50rem;

		padding: 0.4rem;

		border: dashed var(--text-color) 1px;
		border-radius: 1rem;
	}
</style>
