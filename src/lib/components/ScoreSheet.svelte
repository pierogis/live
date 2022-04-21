<script lang="ts">
	import type { Category, Score } from '@prisma/client';

	import ScoreDisplay from './ScoreDisplay.svelte';
	import { session } from '$app/stores';
	import ScoreGraph from './ScoreGraph.svelte';

	export let scores: Score[];
	export let categories: Category[];
	export let scoreUrl: string = null;

	export let tooltip = true;
	export let graph = true;

	export let handleChangeScore: (value: number, categoryId: number) => void = null;
	export let handleClearScore: (categoryId: number) => void = null;

	let overallCategory = categories.find((category) => category.name == 'overall');

	let scoreSetReducer = (previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	};

	let editorialScoresSet: { [categoryId: number]: number } = scores
		.filter((score) => score.userId == 1)
		.reduce(scoreSetReducer, {});
	let userScoresSet: { [categoryId: number]: number } = scores
		.filter((score) => score.userId == $session.user?.id)
		.reduce(scoreSetReducer, {});
</script>

<div style:position="relative" class="no-select">
	{#if tooltip}
		<div aria-describedby="score-summary" class="inner">
			<ScoreDisplay
				editorialScore={editorialScoresSet[overallCategory.id]}
				userScore={userScoresSet[overallCategory.id]}
				handleChangeScore={handleChangeScore
					? (value) => handleChangeScore(value, overallCategory.id)
					: null}
			/>
		</div>
	{/if}

	<div role={tooltip ? 'tooltip' : ''} class="scoresheet border inset shadow" id="score-summary">
		{#each categories as category}
			<div class="category">
				<span class="category-emoji" title={category.name}>{category.symbol}</span>
				<ScoreDisplay
					editorialScore={editorialScoresSet[category.id]}
					userScore={userScoresSet[category.id]}
					handleChangeScore={handleChangeScore
						? (value) => handleChangeScore(value, category.id)
						: null}
				/>
				{#if graph}
					<div class="graph">
						<ScoreGraph scores={scores.filter((score) => score.categoryId == category.id)} />
					</div>
				{:else}
					<input
						class="clear"
						type="submit"
						action="{scoreUrl}/{category}/delete"
						method="post"
						on:submit|preventDefault={handleChangeScore
							? () => handleClearScore(category.id)
							: null}
						value="❌"
					/>
				{/if}
				<br />
			</div>
			{#if category.name == 'overall'}
				<div class="overall-seperator" />
			{/if}
		{/each}
	</div>
</div>

<style>
	.category {
		display: flex;
	}

	[role='tooltip'] {
		visibility: hidden;
		position: absolute;
		z-index: 1;

		text-align: center;

		top: 0%;
		left: 50%;

		margin-top: -0.45rem;
		margin-left: -6.09rem;
	}

	.scoresheet {
		padding: 0.2rem;
		width: 11rem;

		background-color: var(--primary-color);
	}

	.inner {
		padding-bottom: 0.1rem;
		padding-right: 0.4rem;
		padding-left: 0.4rem;

		/* [0] */
		border-top: dotted 0.2rem var(--text-color-st);
		border-left: dotted 0.2rem var(--text-color-st);
		border-bottom: dotted 0.2rem var(--text-color-st);
		border-right: dotted 0.2rem var(--text-color-st);
		border-radius: 0.8rem;
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
		height: 2px;
		border-bottom: 0.2rem double var(--text-color-st);
		margin-bottom: 2px;
	}

	.category-emoji {
		cursor: help;
	}

	.graph,
	.category-emoji,
	.clear {
		flex: 1;
		text-align: center;
	}

	.clear {
		font-size: 0.7rem;
		padding: 0;
	}
</style>
