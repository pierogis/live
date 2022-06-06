<script lang="ts">
	import { get, type Readable } from 'svelte/store';

	import type { Category, Review, Score, User } from '@prisma/client';

	import { Card } from '@pierogis/utensils';

	import ScoreSheet from './ScoreSheet.svelte';

	export let review: Review;
	export let scores: { [categoryId: number]: Readable<Score>[] };

	export let user: User | null = null;

	const editorialScores = Object.entries(scores).reduce(
		(previous, [categoryId, categoryScores]) => {
			previous[categoryId] = categoryScores.find((score) => get(score).userId == review.userId);
			return previous;
		},
		{}
	);

	export let categories: Category[];
</script>

<Card>
	{#if user}
		<a class="link-box border inset shadow" href="/users/{user.serial}">
			{user.serial}
		</a>
	{/if}
	<slot />
	<textarea readonly class="description inset" cols="40" rows="8">{review.description}</textarea>
	<ScoreSheet {categories} {editorialScores} graphScores={scores} />
</Card>

<style>
	.description {
		font-family: 'Lora';
		font-weight: normal;

		text-align: left;

		resize: none;

		max-width: 90%;
	}

	textarea {
		resize: none;
		border-radius: 0.6rem;
	}
</style>
