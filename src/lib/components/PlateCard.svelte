<script lang="ts">
	import type { Plate, Score, Image } from '@prisma/client';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';

	export let plate: PlateWithJurisdiction;

	export let isAdmin: boolean = false;
	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;

	export let small: boolean;

	async function getScores(plateId: number): Promise<Score[]> {
		const response = await fetch(`/plates/${plateId}/scores`);
		const data = await response.json();
		return data.scores;
	}

	async function getImages(plateId: number): Promise<Image[]> {
		const response = await fetch(`/plates/${plateId}/images`);
		const data = await response.json();
		return data.images;
	}

	let scoresPromise: Promise<Score[]> = getScores(plate.id);
	let imagesPromise: Promise<Image[]> = getImages(plate.id);
</script>

<Card>
	{#if isAdmin}
		<form class="admin-controls left" action="/plates/{plate.id}/edit">
			<input type="submit" value="✎" />
		</form>
		<form class="admin-controls right" action="/plates/{plate.id}?_method=DELETE" method="post">
			<input type="submit" value="❌" />
		</form>
	{/if}
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction.id}
			>{plate.jurisdiction.abbreviation}</a
		>
	{/if}

	<a href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : 'plates/' + plate.id)}>
		<div class="image-container">
			{#await imagesPromise then images}
				{#if images[0]}
					<img
						class="image inset shadow"
						class:small
						src={`${images[0].url}/${small ? 'small' : 'medium'}`}
						alt={`${plate.startYear || ''}-${plate.endYear || ''} ${
							plate.jurisdiction
						} license plate`}
					/>
				{:else}
					<img
						class="image inset shadow"
						class:small
						src={'/karl.svg'}
						alt={`${plate.startYear || ''}-${plate.endYear || ''} ${
							plate.jurisdiction
						} license plate`}
					/>
				{/if}
			{/await}
		</div>
	</a>

	{#if showYears}
		<a class="link" href={'/plates/' + plate.id}
			>{`${plate.startYear || '?'}-${plate.endYear || '?'}`}</a
		>
	{/if}
	{#if showScores}
		{#await scoresPromise then scores}
			<Scores scores={scores || []} />
		{/await}
	{/if}
</Card>

<style>
	.admin-controls {
		position: absolute;
		display: flex;
	}
	.admin-controls.left {
		left: 0.4rem;
	}
	.admin-controls.right {
		right: 0.4rem;
	}
	.image {
		object-fit: contain;

		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;

		width: 100%;

		max-width: 400px;
		max-height: 200px;
	}

	.image.small {
		max-width: 200px;
		max-height: 100px;
	}

	.image-container {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
