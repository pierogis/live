<script lang="ts">
	import { onMount } from 'svelte';

	import type { Plate } from '$lib/database/plate';
	import type { Score } from '$lib/database/review';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';

	export let plate: Plate;

	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;

	let scores: Score[] = [];

	async function get(): Promise<void> {
		const response = await fetch(`/${plate.id}/scores`);
		const data = await response.json();
		scores = data.scores;
	}
	onMount(async () => {
		await get();
	});
</script>

<Card>
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction}>{plate.jurisdiction}</a>
	{/if}
	<a
		class="image-link"
		href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : plate.id)}
	>
		<img
			class="image"
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.jurisdiction} license plate for ${plate.startYear}-${plate.endYear}`}
			width="90%"
		/>
	</a>
	{#if showYears}
		<a class="link" href={'/' + plate.id}>{`${plate.startYear}-${plate.endYear}`}</a>
	{/if}

	{#if showScores}<Scores {scores} />{/if}
</Card>

<style>
	.image {
		border-top: solid 4px rgba(100, 100, 100, 0.8);
		border-left: solid 4px rgba(100, 100, 100, 0.8);
		border-bottom: solid 4px rgba(150, 150, 150, 0.8);
		border-right: solid 4px rgba(150, 150, 150, 0.8);
		border-radius: 8%;

		margin: 4px;
	}

	.image-link {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
