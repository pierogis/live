<script lang="ts">
	import type { Category, Score } from '$db/schema';
	import type { Readable, Writable } from 'svelte/store';

	import { Interactable } from '@pierogis/utensils';
	import { ScoreDisplay, ScoreGraph } from '.';

	export let categories: Category[];

	export let editorialScores: { [categoryId: number]: Readable<Score> } = null;
	export let userScores: { [categoryId: number]: Writable<Score> } = null;
	export let graphScores: { [categoryId: number]: Readable<Score>[] } = null;

	export let scoreUrl: string = null;

	const interactive = userScores != null;
</script>

<Interactable clickable={false}>
	<div class="inner">
		{#each categories as category}
			{@const categoryEditorialScore = editorialScores ? editorialScores[category.id] : null}
			{@const categoryUserScore = interactive ? userScores[category.id] : null}
			<div class="category">
				<span class="category-emoji" title={category.name}>{category.symbol}</span>
				<ScoreDisplay editorialScore={categoryEditorialScore} userScore={categoryUserScore} />
				{#if graphScores != null}
					{@const categoryAllScores = graphScores[category.id]}
					<div class="graph">
						<ScoreGraph scoreStores={categoryAllScores} />
					</div>
				{:else if interactive}
					<input
						class="clear"
						type="submit"
						formaction="{scoreUrl}?/delete"
						formmethod="post"
						on:click|preventDefault={() => {
							categoryUserScore.update((score) => {
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
</Interactable>

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
		border-radius: 10px;
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
