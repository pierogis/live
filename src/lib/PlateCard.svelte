<script lang="ts">
	import type { Plate } from '$lib/plates';

	export let plate: Plate;

	export let showState: boolean = true;
	export let showYears: boolean = true;
	export let showScores: boolean = true;

	function parseScore(score: number) {
		const fullScores = Math.floor(score);
		const halfScores = Math.round((score - fullScores) / 0.5) % 2;
		const emptyScores = 5 - (fullScores + halfScores);
		return '★'.repeat(fullScores) + '½'.repeat(halfScores) + '☆'.repeat(emptyScores);
	}
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

	{#if showScores}
		<div style="height: 4px;" />
		<div class="scores">
			<span aria-describedby="starsSummary">{parseScore(plate.scores.overall)}</span>
			<div role="tooltip" id="starsSummary">
				<p class="overall">
					{parseScore(plate.scores.overall)}
				</p>
				{#each Object.entries(plate.scores) as [name, score]}
					{#if name != 'overall'}
						<p>{name[0]}: {parseScore(score)}</p>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.card {
		max-height: 200px;
		max-width: 200px;
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
	@media only screen and (min-width: 600px) {
		.card {
			max-height: 300px;
			max-width: 300px;
		}
	}

	.image {
		padding: 4px;
	}

	.scores {
		position: relative;
		display: inline-block;
		font-size: 1em;
		font-family: monospace;
	}

	[role='tooltip'] {
		visibility: hidden;
		position: absolute;
		z-index: 1;
		background-color: var(--primary-color);

		border-radius: 5%;

		box-shadow: 4px 4px 0 var(--accent-color), -4px -4px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);

		width: 112px;
		top: 0%;
		left: 50%;
		margin-left: -56px;
		text-align: center;
		font-family: monospace;
	}
	@media (hover: hover) and (pointer: fine) {
		[aria-describedby]:hover,
		[aria-describedby]:focus {
			position: relative;
		}
		[aria-describedby]:hover + [role='tooltip'],
		[aria-describedby]:focus + [role='tooltip'],
		[role='tooltip']:hover,
		[role='tooltip']:focus {
			visibility: visible;
		}
	}

	.link {
		color: var(--text-color);
	}

	.overall {
		border-bottom: 2px solid var(--text-color);
	}
</style>
