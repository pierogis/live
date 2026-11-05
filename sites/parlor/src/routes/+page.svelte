<script lang="ts">
	import { Card, Interactable } from '@pierogis/utensils';

	const games = [
		{
			href: '/mosaic',
			name: 'mosaic',
			about: 'lift dots off a picture, sort them by color, and fill it back in',
			extra: { href: '/mosaic/edit', label: 'level editor' }
		},
		{
			href: '/forage',
			name: 'forage',
			about: 'send ant colonies to eat a picture away, color by color, from the outside in'
		}
	];
</script>

<h3 class="tagline">a room for games</h3>

<div class="games">
	{#each games as game (game.href)}
		<Card>
			<Interactable>
				<a class="border inset link-box" href={game.href}>{game.name}</a>
			</Interactable>
			<p>{game.about}</p>
			{#if game.extra}<a href={game.extra.href}>{game.extra.label}</a>{/if}
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
