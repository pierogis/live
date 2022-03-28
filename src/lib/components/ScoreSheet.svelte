<script lang="ts">
	import type { Score } from '@prisma/client';
	import type { Review } from '$lib/database/models';

	import ScoreDisplay from './ScoreDisplay.svelte';
	import { session } from '$app/stores';
	import ScoreGraph from './ScoreGraph.svelte';
	import { categoriesInfo } from '$lib/categoriesInfo';

	export let scores: Score[];
	export let scoreChangeUrl: string;

	export let tooltip = false;

	// if editorial review, use that
	// if no editorial, show averages

	let editorial: Review;
	$: editorial = scores
		.filter((score) => score.userId == 1)
		.reduce((previous, score) => {
			previous[score.category] = score;

			return previous;
		}, {});

	let userReview = scores
		.filter((score) => score.userId == $session.user?.id)
		.reduce(
			(previous, score) => {
				previous[score.category] = score;

				return previous;
			},
			{
				overall: {
					value: null,
					explanation: null
				},
				identifiability: {
					value: null,
					explanation: null
				},
				colors: {
					value: null,
					explanation: null
				},
				symbols: {
					value: null,
					explanation: null
				},
				typeface: {
					value: null,
					explanation: null
				},
				clarity: {
					value: null,
					explanation: null
				}
			}
		);

	const { overall, ...subCategoriesInfo } = categoriesInfo;
</script>

<div class="scores">
	<div aria-describedby="score-summary" class="inner">
		<ScoreDisplay
			editorialScore={editorial['overall']}
			bind:userScore={userReview['overall']}
			scoreChangeUrl={scoreChangeUrl + 'overall'}
		/>
	</div>

	{#if tooltip}{/if}
	<div role="tooltip" class="review border inset shadow" id="score-summary">
		<div class="category">
			<span class="emoji" title="overall">{overall.emoji}</span>
			<ScoreDisplay
				editorialScore={editorial['overall']}
				bind:userScore={userReview['overall']}
				scoreChangeUrl={scoreChangeUrl + 'overall'}
			/>
			<div class="graph">
				<ScoreGraph scores={scores.filter((score) => score.category == 'overall')} />
			</div>
		</div>

		<div class="overall-seperator" />

		{#each Object.entries(subCategoriesInfo) as [category, meta]}
			<div class="category">
				<span class="emoji" title={category}>{meta.emoji}</span>
				<ScoreDisplay
					editorialScore={editorial[category]}
					bind:userScore={userReview[category]}
					scoreChangeUrl={scoreChangeUrl + category}
				/>
				<div class="graph">
					<ScoreGraph scores={scores.filter((score) => score.category == category)} />
				</div>
				<br />
			</div>
		{/each}
	</div>
</div>

<style>
	.scores {
		position: relative;
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

	.review {
		padding: 0.2rem;
		width: 11rem;
		top: 0%;
		left: 50%;

		background-color: var(--primary-color);

		margin-top: -0.5rem;

		margin-left: -6.09rem;
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
		border-bottom: 4px double var(--text-color-st);
		margin-bottom: 2px;
	}
	.emoji {
		cursor: help;
		flex: 1;
	}
	.graph {
		flex: 1;
	}
</style>
