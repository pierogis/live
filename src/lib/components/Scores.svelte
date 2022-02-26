<script lang="ts">
	import type { Scoresheet } from '$lib/database/scoresheet';

	import ScoreDisplay from './ScoreDisplay.svelte';

	export let scoresheets: Scoresheet[];

	const categories = {
		identifiability: { emoji: '👁️' },
		colors: { emoji: '🎨' },
		symbols: { emoji: '💫' },
		typeface: { emoji: '🔤' },
		clarity: { emoji: '👓' }
	};

	let scoresheet = scoresheets[0];
</script>

<div style="height: 4px;" />
<div class="scores">
	<span aria-describedby="starsSummary">
		<ScoreDisplay score={scoresheet.overall} />
	</span>
	<div role="tooltip" class="scoresheet" id="starsSummary">
		<ScoreDisplay bind:score={scoresheet.overall} />
		<div class="overall-seperator" />
		{#each Object.entries(scoresheet) as [name, category]}
			{#if name != 'overall'}
				<div class="category">
					<span class="emoji" title={name}>{categories[name].emoji} </span>
					<ScoreDisplay score={category} />
					<div style="flex: 1;" />
					<br />
				</div>
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

		user-select: none;
	}

	.category {
		display: flex;
	}

	[role='tooltip'] {
		visibility: hidden;
		position: absolute;
		z-index: 1;

		text-align: center;

		-webkit-user-select: none;
		user-select: none;
	}

	.scoresheet {
		width: 192px;
		top: 0%;
		left: 50%;
		margin-left: -96px;

		background-color: var(--primary-color);
		box-shadow: 4px 4px 0 var(--accent-color), -4px -4px 0 var(--secondary-color),
			0px 0px 10px 2px rgba(0, 0, 0, 0.4);
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
	.emoji {
		cursor: help;
		flex: 1;
	}
</style>
