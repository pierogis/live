<script lang="ts">
	import type { Plate } from '$lib/database/plate';
	import Scores from './Scores.svelte';

	export let plate: Plate;

	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;
</script>

<div class="card">
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction}>{plate.jurisdiction}</a>
	{/if}
	<a href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : plate.id)}>
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

	{#if showScores}<Scores plateId={plate.id} reviews={plate.reviews} />{/if}
</div>

<style>
	.card {
		max-height: 90vw;
		max-width: 90vw;
		padding: 8px;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;

		text-align: center;

		background-color: var(--primary-color);

		box-shadow: inset 0px 0px 4px 2px rgba(165, 165, 165, 0.393),
			0px 0px 4px 2px rgba(165, 165, 165, 0.393);

		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		border-radius: 5%;
	}

	/* @media only screen and (min-width: 400px) {
		.card {
		max-height: 200px;
		max-width: 200px;
		}
	} */
	@media only screen and (min-width: 700px) {
		.card {
			max-height: 384px;
			max-width: 384px;
		}
	}

	.image {
		border-top: solid 4px rgba(100, 100, 100, 0.8);
		border-left: solid 4px rgba(100, 100, 100, 0.8);
		border-bottom: solid 4px rgba(150, 150, 150, 0.8);
		border-right: solid 4px rgba(150, 150, 150, 0.8);
		border-radius: 8%;

		margin: 4px;
	}

	.link {
		color: var(--text-color);
	}
</style>
