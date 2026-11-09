<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	import { GAMES } from '#lib/games.js';
</script>

<h3 class="tagline">a room for games</h3>

<div class="games">
	{#each GAMES as game (game.id)}
		<Card>
			<Interactable>
				<a class="border inset link-box" href="/{game.id}">{game.name}</a>
			</Interactable>
			<p>{game.about}</p>
			<p>
				<a href="/{game.id}/pictures">pictures</a> · <a href="/{game.id}/edit">level editor</a>
			</p>
		</Card>
	{/each}
</div>

<style>
	.tagline {
		margin: 0;
		text-align: center;
	}
	.games {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1rem;
		width: 100%;
		max-width: 800px;
	}
	p {
		margin: 0.5rem 0 0;
	}
</style>
