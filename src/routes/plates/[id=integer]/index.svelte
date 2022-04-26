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

	import { transformScores } from '$lib/api/scores';

	import { CardsGrid } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import Review from '$lib/components/ReviewCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

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

<div class="top section">
	<PlateCard {plate} isAdmin={user?.isAdmin} small={false} />

	<br />

	<div class="editorial">
		<ScoreSheet {categories} {editorialScores} {graphScores} />

		{#if editorialReview}
			<textarea class="inset" readonly rows="16">{editorialReview?.description || ''}</textarea>
		{/if}
	</div>
</div>

<div class="divider horizontal" />

<span class="section-title">user review</span>
{#if $session.user}
	<form id={submitReviewFormId} action={`/plates/${plate.modelId}/review`} method="post" />
	<form id={deleteReviewFormId} action={`/plates/${plate.modelId}/review/delete`} method="post" />
	<div class="user section">
		<ScoreSheet {categories} {userScores} {scoreUrl} />
		<label hidden for={reviewTextareaId}>review</label>
		<textarea
			id={reviewTextareaId}
			class="inset"
			form={submitReviewFormId}
			name={reviewDescriptionInputName}
			required
			type="text"
			rows="10"
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

<span class="section-title">reviews</span>

<div class="section">
	<CardsGrid>
		{#each plate.model.reviews as review}
			<Review {categories} {review} scores={graphScores} />
		{/each}
	</CardsGrid>
</div>

<style>
	.top {
		display: flex;
		flex-direction: column;

		justify-content: center;
		align-items: center;
	}

	.editorial,
	.user {
		width: 100%;
		padding: 1rem;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;

		gap: 2rem;
	}

	.divider.horizontal {
		height: var(--divider-size);
		width: 90vw;
		margin: 1rem;
	}

	textarea {
		width: 90%;
		max-width: 80rem;

		font-family: 'Lora';
		font-weight: normal;
	}

	@media only screen and (max-width: 70rem) {
		.top,
		.user,
		.editorial {
			flex-direction: column;
		}
	}

	.section {
		width: 90%;
	}

	.section-title {
		text-decoration: underline;
		margin-bottom: 1rem;
	}
</style>
