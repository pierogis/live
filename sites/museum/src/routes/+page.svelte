<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	import { GAMES } from '#lib/games.js';
	import { art } from '#lib/shared/art.js';

	let { data } = $props();
</script>

<h3 class="tagline">in which you can appreciate art</h3>

<div class="games">
	{#each GAMES as game (game.id)}
		<Card>
			<!-- The name below is the link for keyboards and screen readers; the picture is a bigger target. -->
			<a class="cover" href="/{game.id}" tabindex="-1" aria-hidden="true">
				<canvas {@attach art(data.covers[game.id], 0, 8)}></canvas>
			</a>
			<Interactable>
				<a class="border inset link-box" href="/{game.id}">{game.name}</a>
			</Interactable>
		</Card>
	{/each}
</div>

<style>
	.tagline {
		margin: 0;
		text-align: center;
	}
	/* Two columns at every width, each card as wide as there's room for. */
	.games {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
		width: 100%;
		max-width: 1040px;
	}
	/*
	 * Every cover the card's width and one shape, so the names line up, with its mural
	 * as big as fits. Drawn at 8 pixels a dot and scaled down, its dots stay even.
	 */
	.cover {
		display: block;
		aspect-ratio: 4 / 3;
		margin-bottom: 0.75rem;
	}
	.cover canvas {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
