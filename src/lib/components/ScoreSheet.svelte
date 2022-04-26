<script lang="ts">
	import type { Category, Score } from '@prisma/client';
	import type { Readable, Writable } from 'svelte/store';

	import ScoreDisplay from './ScoreDisplay.svelte';
	import ScoreGraph from './ScoreGraph.svelte';

	export let categories: Category[];

	export let editorialScores: { [categoryId: number]: Readable<Score> } = null;
	export let userScores: { [categoryId: number]: Writable<Score> } = null;
	export let graphScores: { [categoryId: number]: Readable<Score>[] } = null;

	export let scoreUrl: string = null;

	const interactive = userScores != null;
</script>

<div style:position="relative" class="no-select">
	<div class="inner">
		{#each categories as category}
			<div class="category">
				<span class="category-emoji" title={category.name}>{category.symbol}</span>
				<ScoreDisplay
					editorialScore={editorialScores ? editorialScores[category.id] : null}
					userScore={interactive ? userScores[category.id] : null}
				/>
				{#if graphScores != null}
					<div class="graph">
						<ScoreGraph scoreStores={graphScores[category.id]} />
					</div>
				{:else if interactive}
					<input
						class="clear"
						type="submit"
						action="{scoreUrl}/{category}/delete"
						method="post"
						on:click|preventDefault={() => {
							userScores[category.id].update((score) => {
								score.value = null;
								return score;
							});
						}}
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

	.inner {
		width: 12rem;
		padding-left: 0.2rem;
		padding-right: 0.2rem;
		padding-top: 0.4rem;
		padding-bottom: 0.4rem;

		border: dotted 0.2rem var(--text-color-st);
		border-radius: 0.8rem;
	}
	.overall-seperator {
		height: 2px;
		border-bottom: 0.1rem solid var(--text-color-st);
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

		-webkit-appearance: none;
		-moz-appearance: none;
		appearance: none;
	}
</style>
