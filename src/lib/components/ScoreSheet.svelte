<script lang="ts">
	import { type Score, Category } from '@prisma/client';

	import ScoreDisplay from './ScoreDisplay.svelte';
	import { session } from '$app/stores';
	import ScoreGraph from './ScoreGraph.svelte';
	import { categoriesInfo } from '$lib/categoriesInfo';
	import { goto } from '$app/navigation';

	export let scores: Score[];
	export let scoreUrl: string = null;

	export let tooltip = true;
	export let graph = true;

	let editorialScores: {
		[category in Category]?: number;
	};
	$: editorialScores = scores
		.filter((score) => score.userId == 1)
		.reduce((previous, score) => {
			previous[score.category] = score;

			return previous;
		}, {});

	let userScores: {
		[category in Category]?: number;
	} = scores
		.filter((score) => score.userId == $session.user?.id)
		.reduce(
			(previous, score) => {
				previous[score.category] = score.value;

				return previous;
			},
			{
				overall: null,
				identifiability: null,
				colors: null,
				symbols: null,
				typeface: null,
				clarity: null
			}
		);

	const { overall, ...subCategoriesInfo } = categoriesInfo;

	function clearScoreAction(element: HTMLElement, params: { category: string }) {
		async function handleClick(event: PointerEvent) {
			if (event.button == 0) {
				if (!$session.user) {
					goto('/login');
				} else {
					userScores[params.category] = null;
					const res = fetch(scoreUrl + params.category, {
						method: 'DELETE'
					});
				}
			}
		}

		if (scoreUrl) {
			element.addEventListener('pointerdown', handleClick);
		}

		return {
			update(newParams: { category: Category }) {
				params = newParams;
			},
			destroy() {
				if (scoreUrl) {
					element.removeEventListener('pointerdown', handleClick);
				}
			}
		};
	}
</script>

<div style:position="relative">
	{#if tooltip}
		<div aria-describedby="score-summary" class="inner">
			<ScoreDisplay
				editorialScore={editorialScores['overall']}
				bind:userScore={userScores['overall']}
				categoryScoreUrl={scoreUrl ? scoreUrl + 'overall' : null}
			/>
		</div>
	{/if}

	<div role={tooltip ? 'tooltip' : ''} class="scores border inset shadow" id="score-summary">
		<div class="category">
			<span class="category-emoji" title="overall">{overall.emoji}</span>
			<ScoreDisplay
				editorialScore={editorialScores['overall']}
				bind:userScore={userScores['overall']}
				categoryScoreUrl={scoreUrl ? scoreUrl + 'overall' : null}
			/>
			{#if graph}
				<div class="graph">
					<ScoreGraph scores={scores.filter((score) => score.category == 'overall')} />
				</div>
			{:else}
				<input
					class="clear"
					type="submit"
					action={scoreUrl + 'overall'}
					method="delete"
					use:clearScoreAction={{ category: Category.overall }}
					value="❌"
				/>
			{/if}
		</div>

		<div class="overall-seperator" />

		{#each Object.entries(subCategoriesInfo) as [category, meta]}
			<div class="category">
				<span class="category-emoji" title={category}>{meta.emoji}</span>
				<ScoreDisplay
					editorialScore={editorialScores[category]}
					bind:userScore={userScores[category]}
					categoryScoreUrl={scoreUrl ? scoreUrl + category : null}
				/>
				{#if graph}
					<div class="graph">
						<ScoreGraph scores={scores.filter((score) => score.category == category)} />
					</div>
				{:else}
					<input
						class="clear"
						type="submit"
						action={scoreUrl + category}
						method="delete"
						use:clearScoreAction={{ category }}
						value="❌"
					/>
				{/if}
				<br />
			</div>
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

		-webkit-user-select: none;
		user-select: none;

		top: 0%;
		left: 50%;

		margin-top: -0.45rem;
		margin-left: -6.09rem;
	}

	.scores {
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
