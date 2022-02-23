<script lang="ts">
	import type { Scores } from '../models';

	export let scores: Scores;
	function parseScore(score: number) {
		const fullScores = Math.floor(score);
		const halfScores = Math.round((score - fullScores) / 0.5) % 2;
		const emptyScores = 5 - (fullScores + halfScores);
		return '★'.repeat(fullScores) + '½'.repeat(halfScores) + '☆'.repeat(emptyScores);
	}

	const emojis = {
		identifiability: '👁️',
		colors: '🎨',
		symbols: '💫',
		typeface: '🔤',
		clarity: '👓'
	};
</script>

<div style="height: 4px;" />
<div class="scores">
	<span aria-describedby="starsSummary">{parseScore(scores.overall.score)}</span>
	<div role="tooltip" id="starsSummary">
		<p class="overall">
			{parseScore(scores.overall.score)}
		</p>
		{#each Object.entries(scores) as [name, category]}
			{#if name != 'overall'}
				<p>{emojis[name]}: {parseScore(category.score)}</p>
			{/if}
		{/each}
	</div>
</div>

<style>
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
	.overall {
		border-bottom: 2px solid var(--text-color);
	}
</style>
