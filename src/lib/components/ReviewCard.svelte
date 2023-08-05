<script lang="ts">
	import { get, type Readable } from 'svelte/store';

	import type { Category, Review, Score, User } from '$db/schema';

	import { Card, Interactable } from '@pierogis/utensils';

	import { ScoreSheet } from '.';

	export let review: Readable<
		Review & {
			user: Omit<User, 'email'>;
		}
	>;
	export let scores: { [categoryId: number]: Readable<Score>[] };

	const editorialScores = Object.entries(scores).reduce<{
		[categoryId: number]: Readable<Score>;
	}>((previous, [categoryId, categoryScores]) => {
		const categoryScore = categoryScores.find((score) => get(score).userId == $review.userId);
		if (categoryScore !== undefined) {
			previous[parseInt(categoryId)] = categoryScore;
		}
		return previous;
	}, {});

	export let categories: Category[];
</script>

<Interactable clickable={false}>
	<Card>
		{#if $review.user}
			<Interactable>
				<a class="link-box border inset" href="/users/{$review.user.serial}">
					{$review.user.serial}
				</a>
			</Interactable>
		{/if}
		<slot />
		<textarea readonly class="inset" cols="40" rows="8">{$review.description}</textarea>
		<ScoreSheet interactive={false} {categories} {editorialScores} graphScores={scores} />
	</Card>
</Interactable>

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
