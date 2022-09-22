<script lang="ts">
	import { get, type Readable } from 'svelte/store';

	import type { Category, Review, Score, User } from '@prisma/client';

	import { Card } from '@pierogis/utensils';

	import ScoreSheet from './ScoreSheet.svelte';

	export let review: Readable<
		Review & {
			user: User;
		}
	>;
	export let scores: { [categoryId: number]: Readable<Score>[] };

	const editorialScores = Object.entries(scores).reduce<{ [categoryId: number]: Readable<Score> }>(
		(previous, [categoryId, categoryScores]) => {
			previous[parseInt(categoryId)] = categoryScores.find(
				(score) => get(score).userId == $review.userId
			);
			return previous;
		},
		{}
	);

	export let categories: Category[];
</script>

<Card>
	{#if $review.user}
		<a class="link-box border inset shadow" href="/users/{$review.user.serial}">
			{$review.user.serial}
		</a>
	{/if}
	<slot />
	<textarea readonly class="inset" cols="40" rows="8">{$review.description}</textarea>
	<ScoreSheet {categories} {editorialScores} graphScores={scores} />
</Card>

<style>
	textarea {
		max-width: 90%;
		resize: none;

		text-align: left;

		border-radius: 0.6rem;

		font-size: 16px;
		font-weight: 400;
		font-weight: normal;
	}
</style>
