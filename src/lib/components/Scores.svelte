<script lang="ts">
	import type { Score, Review } from '$lib/database/models';

	import ScoreDisplay from './ScoreDisplay.svelte';

	export let scores: Score[];

	const categories = {
		identifiability: { emoji: '👁️' },
		colors: { emoji: '🎨' },
		symbols: { emoji: '💫' },
		typeface: { emoji: '🔤' },
		clarity: { emoji: '👓' }
	};

	// if editorial review, use that
	// if no editorial, show averages

	let editorial: Review;
	$: editorial = scores
		.filter((score) => score.userId == 0)
		.reduce((previous, score) => {
			previous[score.category] = score;

			return previous;
		}, {});

	const userId = 0;

	const partialScore = {
		value: null,
		description: null
	};
	let userReview = scores
		.filter((score) => score.userId == userId)
		.reduce(
			(previous, score) => {
				previous[score.category] = score;

				return previous;
			},
			{
				overall: {
					value: null,
					description: null
				},
				identifiability: {
					value: null,
					description: null
				},
				colors: {
					value: null,
					description: null
				},
				symbols: {
					value: null,
					description: null
				},
				typeface: {
					value: null,
					description: null
				},
				clarity: {
					value: null,
					description: null
				}
			}
		);

	let reviews: {
		[userId: string]: Review;
	} = {};

	// $: review = editorial
	// 	? editorial
	// 	: reviews.reduce((previous, review) => {
	// 			previous.overall.value = review.overall.value / reviews.length;
	// 			previous.identifiability.value = review.identifiability / reviews.length;
	// 			previous.colors.value = review.colors.value / reviews.length;
	// 			previous.symbols.value = review.symbols.value / reviews.length;
	// 			previous.typeface.value = review.typeface.value / reviews.length;
	// 			previous.clarity.value = review.clarity.value / reviews.length;
	// 			return previous;
	// 	  });

	// if no user score for this category, show editorial
	// if user score, font color should be differents
</script>

<div class="scores">
	<span aria-describedby="starsSummary">
		<ScoreDisplay editorialScore={editorial['overall']} bind:userScore={userReview['overall']} />
	</span>
	<div role="tooltip" class="review" id="starsSummary">
		<ScoreDisplay editorialScore={editorial['overall']} bind:userScore={userReview['overall']} />
		<div class="overall-seperator" />
		{#each Object.entries(categories) as [name, meta]}
			<div class="category">
				<span class="emoji" title={name}>{meta.emoji} </span>
				<ScoreDisplay editorialScore={editorial[name]} bind:userScore={userReview[name]} />
				<div class="graph" />
				<br />
			</div>
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

	.review {
		width: 192px;
		top: 0%;
		left: 50%;

		background-color: var(--primary-color);

		box-shadow: inset 0px 0px 4px 2px rgba(165, 165, 165, 0.393),
			0px 0px 4px 2px rgba(165, 165, 165, 0.393);

		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		margin: -5px;

		/* half of width plus 5px offset for border to center */
		margin-left: -101px;

		border-radius: 5%;
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
	.graph {
		flex: 1;
	}
</style>
