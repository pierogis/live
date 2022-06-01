<script lang="ts">
	import { get, type Readable } from 'svelte/store';

	import type { Category, Review, Score, User } from '@prisma/client';

	import { Card } from '@pierogis/utensils';

	import ScoreSheet from './ScoreSheet.svelte';

	export let review: Review & { user: User };
	export let scores: { [categoryId: number]: Readable<Score>[] };

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
	<a class="link-box border inset shadow" href="/users/{review.user.serial}">
		{review.user.serial}
	</a>
	<textarea readonly class="description inset" cols="40" rows="40">{review.description}</textarea>
	<ScoreSheet {categories} {editorialScores} graphScores={scores} />
</Card>

<style>
	.description {
		font-family: 'Lora';
		font-weight: normal;

		text-align: left;

		resize: none;

		max-width: 90%;
		max-height: 10rem;
	}
</style>
