<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	import { GAMES } from '#lib/games.js';
	import { art } from '#lib/shared/art.js';

	let { data } = $props();

	type Cover = (typeof data.covers)[keyof typeof data.covers];
	/** Whether dot (x, y) of a cover is in a panel you haven't finished. */
	const unfinished = (c: Cover) => (x: number, y: number) =>
		!c.done[Math.floor(y / c.panel.h) * c.cols + Math.floor(x / c.panel.w)];
</script>

<h3 class="tagline">a quiet room with pictures</h3>

<div class="games">
	{#each GAMES as game (game.id)}
		{@const c = data.covers[game.id]}
		<div class="game">
			<!-- The mural you're on, its finished panels in color. The name below is the link for
			     keyboards and screen readers; the picture is a bigger target. -->
			<div class="stage">
				<a
					class="cover"
					href="/{game.id}"
					tabindex="-1"
					aria-hidden="true"
					style:--ratio="{c.art[0].length} / {c.art.length}"
				>
					<Card>
						<canvas {@attach art(c, 0, 8, unfinished(c))}></canvas>
					</Card>
				</a>
			</div>
			<Interactable>
				<a class="border inset link-box" href="/{game.id}">{game.name}</a>
			</Interactable>
		</div>
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
	.game {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.75rem;
	}
	/*
	 * The same shape for every game, so the names below line up; in it, the mural's card,
	 * as big as fits, hugging the picture like a mural's card on its game's page.
	 */
	.stage {
		width: 100%;
		aspect-ratio: 4 / 3;
		container-type: size;
		display: grid;
		place-items: center;
	}
	.cover {
		display: block;
		line-height: 0;
	}
	/* Just inside the card's 2px inner ring. */
	.cover :global(.card) {
		padding: 2px;
		height: auto;
	}
	/* Its border and ring take 12px; drawn at 8 pixels a dot and scaled down, its dots stay even. */
	.cover canvas {
		display: block;
		width: min(calc(100cqw - 12px), calc((100cqh - 12px) * var(--ratio)));
		height: auto;
		border-radius: 4px;
	}
</style>
