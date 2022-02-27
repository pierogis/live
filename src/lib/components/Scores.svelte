<script lang="ts">
	import type { Review } from '$lib/database/review';

	import ScoreDisplay from './ScoreDisplay.svelte';

	export let plateId: number;
	export let reviews: Review[];

	const categories = {
		identifiability: { emoji: '👁️' },
		colors: { emoji: '🎨' },
		symbols: { emoji: '💫' },
		typeface: { emoji: '🔤' },
		clarity: { emoji: '👓' }
	};

	// if editorial review, use that
	// if no editorial, show averages

	let editorial = reviews[0];

	const score = { id: null, reviewId: null, value: 0, description: '' };
	let provisionalReview: Review = {
		id: null,
		plateId: plateId,
		scores: {
			overall: score,
			identifiability: score,
			colors: score,
			symbols: score,
			typeface: score,
			clarity: score
		}
	};

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
</script>

<div style="height: 4px;" />
<div class="scores">
	<span aria-describedby="starsSummary">
		<ScoreDisplay score={editorial.scores.overall} />
	</span>
	<div role="tooltip" class="review" id="starsSummary">
		<ScoreDisplay bind:score={editorial.scores.overall} />
		<div class="overall-seperator" />
		{#each Object.entries(editorial) as [name, category]}
			{#if name != 'overall'}
				<div class="category">
					<span class="emoji" title={name}>{categories[name].emoji} </span>
					<ScoreDisplay score={category} />
					<div class="graph" />
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

	.review {
		width: 192px;
		top: 0%;
		left: 50%;
		margin-left: -96px;

		background-color: var(--primary-color);
		box-shadow: 4px 4px 0 var(--accent-color), -4px -4px 0 var(--secondary-color),
			0px 0px 16px 4px rgba(0, 0, 0, 0.5);
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
