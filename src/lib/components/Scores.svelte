<script lang="ts">
	import type { Scores } from '../models';

	import ScoreDisplay from './ScoreDisplay.svelte';

	export let scores: Scores;

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
	<span aria-describedby="starsSummary"><ScoreDisplay score={scores.overall} /></span>
	<div role="tooltip" id="starsSummary">
		<ScoreDisplay score={scores.overall} />
		<div class="overall-seperator" />
		{#each Object.entries(scores) as [name, category]}
			{#if name != 'overall'}
				<span>{emojis[name]}: <ScoreDisplay score={category} /></span>
				<br />
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
	.overall-seperator {
		border-bottom: 2px solid var(--text-color);
	}
</style>
