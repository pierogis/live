<!-- plates/[id=integer]/index.svelte -->
<script lang="ts" context="module">
	/** @type {import('./plates/[id=integer]/index').Load} */
	export async function load({ session, params, fetch }) {
		const platesResponse = await fetch(`/api/plates/${params.id}`);
		const categoriesResponse = await fetch(`/api/plates/categories`);

		if (platesResponse.status == 404) {
			return { status: 404, error: "plate doesn't exist" };
		}

		const plate: FullPlate = await platesResponse.json();
		const categories: Category[] = await categoriesResponse.json();

		return {
			props: { categories, plate, user: session.user }
		};
	}
</script>

<script lang="ts">
	import type { Category, User } from '@prisma/client';
	import { session } from '$app/stores';
	import { goto, invalidate } from '$app/navigation';

	import type { FullPlate } from '$lib/database/models';
	import { reviewDescriptionInputName, reviewIdInputName } from './review/_form';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import Review from '$lib/components/Review.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';
	import { transformScores } from '$lib/api/scores';

	export let categories: Category[];
	export let plate: FullPlate;
	export let user: User;

	const editorialReview = plate.model.reviews.find((review) => review.user.id == 1);

	const emptyUserReview = {
		id: null,
		modelId: plate.modelId,
		userId: user?.id,
		description: ''
	};

	const { userScores, editorialScores, graphScores } = transformScores(
		plate.model.scores,
		plate.modelId,
		user?.id,
		categories
	);

	const userReview =
		plate.model.reviews.find((review) => review.user.id == user?.id) || emptyUserReview;

	const submitReviewFormId = 'userReview';
	const deleteReviewFormId = 'delete';
	const reviewTextareaId = 'review';

	const scoreUrl = `/plates/${plate.modelId}/scores/`;

	async function handleSubmitReview() {
		const data = { description: userReview.description };

		if (userReview.id) {
			await fetch(`/api/plates/${plate.modelId}/reviews/${userReview.id}`, {
				method: 'put',
				body: JSON.stringify(data)
			});
		} else {
			await fetch(`/api/plates/${plate.modelId}/reviews`, {
				method: 'post',
				body: JSON.stringify(data)
			});
		}

		invalidate(`/api/plates/${plate.modelId}`);
	}

	async function handleDeleteReview() {
		if (userReview.id) {
			await fetch(`/api/plates/${plate.modelId}/reviews/${userReview.id}`, { method: 'delete' });
		}

		invalidate(`/api/plates/${plate.modelId}`);
	}
</script>

<svelte:head>
	<title>{plate.jurisdiction.name} plate ({plate.startYear || '?'}-{plate.endYear || '?'})</title>
</svelte:head>

<div class="top">
	<div class="plate">
		<PlateCard {plate} isAdmin={user?.isAdmin} small={false}>
			<ScoreSheet {categories} {editorialScores} {graphScores} />
		</PlateCard>
	</div>

	{#if editorialReview}
		<div class="editorial">
			{editorialReview?.description || ''}
		</div>
	{/if}
</div>

<div class="divider horizontal" />

<span class="section">user review</span>
{#if $session.user}
	<form id={submitReviewFormId} action={`/plates/${plate.modelId}/review`} method="post" />
	<form id={deleteReviewFormId} action={`/plates/${plate.modelId}/review/delete`} method="post" />
	<div class="user-review">
		<ScoreSheet {categories} {userScores} {scoreUrl} tooltip={false} />
		<label hidden for={reviewTextareaId}>review</label>
		<textarea
			id={reviewTextareaId}
			class="border inset shadow"
			form={submitReviewFormId}
			name={reviewDescriptionInputName}
			required
			type="text"
			rows="8"
			bind:value={userReview.description}
		/>
		<input hidden form={deleteReviewFormId} name={reviewIdInputName} value={userReview.id} />
	</div>
	<div>
		<button
			class="border inset shadow good no-select"
			type="submit"
			form={submitReviewFormId}
			on:click|preventDefault={handleSubmitReview}
		>
			submit
		</button>
		<button
			class="border inset shadow bad no-select"
			type="submit"
			form={deleteReviewFormId}
			on:click|preventDefault={handleDeleteReview}
		>
			delete
		</button>
	</div>
{:else}
	<a
		class="border inset shadow good no-select"
		href="/login"
		on:click|preventDefault={() => goto('/login')}
	>
		login
	</a>
{/if}

<div class="divider horizontal" />

<span class="section">reviews</span>
<div class="reviews">
	{#each plate.model.reviews as review}
		<Review {review} scores={plate.model.scores.filter((score) => score.userId == review.userId)} />
	{/each}
</div>

<style>
	.top {
		width: 75%;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;

		padding-bottom: 2rem;
	}

	.plate {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.editorial {
		width: 90%;
		height: 90%;
		padding-left: 4rem;

		flex: 2;
		display: flex;
		justify-content: center;
		align-items: center;

		white-space: pre-line;
		line-height: 1.4;
	}

	.divider.horizontal {
		height: var(--divider-size);
		width: 90vw;
		margin: 1rem;
	}

	.editorial,
	textarea {
		font-family: 'Lora';
		font-weight: normal;
	}

	.user-review {
		width: 80%;

		display: flex;
		flex-direction: row;

		gap: 1rem;

		justify-content: center;
		align-items: center;
	}

	.reviews {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	textarea {
		width: 100%;
	}

	@media only screen and (max-width: 70rem) {
		.top {
			flex-direction: column;
		}
		.editorial {
			padding-top: 2rem;
			padding-left: 0;
		}
		.user-review {
			flex-direction: column;
		}
	}

	.section {
		text-decoration: underline;
		margin-bottom: 1rem;
	}
</style>
