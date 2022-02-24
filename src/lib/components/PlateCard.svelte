<script lang="ts">
	import type { Plate } from '$lib/models';
	import Scores from './Scores.svelte';

	export let plate: Plate;

	export let showState: boolean = true;
	export let showYears: boolean = true;
	export let showScores: boolean = true;
</script>

<div class="card">
	{#if showState}
		<a class="link" href={'/states/' + plate.state}>{plate.state}</a>
	{/if}
	<a href={'/' + (!showYears ? 'states/' + plate.state : plate.id)}>
		<img
			class="image"
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.state} license plate for ${plate.startYear}-${plate.endYear}`}
			width="90%"
		/>
	</a>
	{#if showYears}
		<a class="link" href={'/' + plate.id}>{`${plate.startYear}-${plate.endYear}`}</a>
	{/if}

	{#if showScores}<Scores scores={plate.scores} />{/if}
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

		box-shadow: 5px 5px 0 var(--accent-color), -5px -5px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);
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
		padding: 4px;
	}

	.link {
		color: var(--text-color);
	}
</style>
