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
	<a href={'/' + (!showYears ? 'states/' + plate.state : plate.id)}>
		<img
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.state} license plate for ${plate.startYear}-${plate.endYear}`}
			width="90%"
		/>
	</a>
	{#if showState}
		<a class="link" href={'/states/' + plate.state}>{plate.state}</a>
	{/if}
	{#if showYears}
		<a class="link" href={'/' + plate.id}>{`${plate.startYear}-${plate.endYear}`}</a>
	{/if}

	{#if showScores}
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

	.scores {
		font-size: 1em;
		position: relative;
		display: inline-block;
		font-family: monospace;
	}

	[role='tooltip'] {
		visibility: hidden;
		position: absolute;
		z-index: 1;
		background-color: var(--primary-color);

		box-shadow: 5px 5px 0 var(--accent-color), -5px -5px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);

		width: 100px;
		top: 0%;
		left: 50%;
		margin-left: -50px; /* Use half of the width (120/2 = 60), to center the tooltip */
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
		border-bottom: 2px dashed var(--text-color);
	}
</style>
