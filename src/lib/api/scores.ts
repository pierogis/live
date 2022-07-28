import { goto } from '$app/navigation';
import { PUBLIC_API_BASE } from '$env/static/public';
import type { Category, Score } from '@prisma/client';
import { writable, type Writable } from 'svelte/store';

async function handleChangeScore(score: Score) {
	if (!score.userId) {
		goto(`/login?redirectUrl=/plates/${score.modelId}`);
	} else {
		if (score.value) {
			const data = { value: score.value };
			await fetch(`${PUBLIC_API_BASE}/plates/${score.modelId}/scores/${score.categoryId}`, {
				method: 'put',
				body: JSON.stringify(data)
			});
		} else {
			await fetch(`${PUBLIC_API_BASE}/plates/${score.modelId}/scores/${score.categoryId}`, {
				method: 'delete'
			});
		}
	}
}

export function storeScores(
	scores: Score[],
	modelId: number,
	userId: number,
	categories: Category[]
) {
	const userScores = categories.reduce<{
		[categoryId: number]: Writable<Score>;
	}>((previous, category) => {
		previous[category.id] = writable({
			modelId: modelId,
			userId: userId,
			categoryId: category.id,
			value: null
		});
		return previous;
	}, {});

	let editorialScores = categories.reduce<{
		[categoryId: number]: Writable<Score>;
	}>((previous, category) => {
		previous[category.id] = writable({
			modelId: modelId,
			userId: 1,
			categoryId: category.id,
			value: null
		});
		return previous;
	}, {});
	const allScores = categories.reduce<{
		[categoryId: number]: Writable<Score>[];
	}>((previous, category) => {
		previous[category.id] = [];
		return previous;
	}, {});

	scores.forEach((score) => {
		const scoreStore = writable(score);

		if (score.userId == userId) {
			userScores[score.categoryId] = scoreStore;
		}

		if (score.userId == 1) {
			editorialScores[score.categoryId] = scoreStore;
		}

		allScores[score.categoryId].push(scoreStore);
	});

	if (userId == 1) {
		editorialScores = userScores;
	}

	Object.entries(userScores).forEach(([_categoryId, scoreStore]) => {
		let fired = false;
		let previousValue: number;
		scoreStore.subscribe(async (score) => {
			if (!fired) {
				fired = true;
			} else {
				if (score.value != previousValue) {
					await handleChangeScore(score);
				}
			}
			previousValue = score.value;
		});
	});

	return { userScores, editorialScores, allScores };
}
