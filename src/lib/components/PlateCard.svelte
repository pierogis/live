<script lang="ts">
	import type { Plate, Score, Image } from '$lib/database/models';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';

	export let plate: Plate;

	export let isAdmin: boolean = false;
	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;

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
		<form class="admin left" action="/plates/{plate.id}/edit">
			<input type="submit" value="✎" />
		</form>
		<form class="admin right" action="/plates/{plate.id}?_method=DELETE" method="post">
			<input type="submit" value="❌" />
		</form>
	{/if}
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction}>{plate.jurisdiction}</a>
	{/if}

	<a href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : 'plates/' + plate.id)}>
		<div class="image-container">
			{#await imagesPromise then images}
				{#if images[0]}
					<img
						class="image inset shadow"
						src={images[0].url}
						alt={`${plate.startYear || ''}-${plate.endYear || ''} ${
							plate.jurisdiction
						} license plate`}
					/>
				{:else}
					<img
						class="image inset shadow"
						src={'/static/karl.svg'}
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
	.admin {
		position: absolute;
		display: flex;
	}
	.admin.left {
		left: 0.4rem;
	}
	.admin.right {
		right: 0.4rem;
	}
	.image {
		width: 90%;
		object-fit: contain;

		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;
	}

	.image-container {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
