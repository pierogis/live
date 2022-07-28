<!-- plates/[id=integer]/index.svelte -->
<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';

	import type { Load } from './__types';
	export const load: Load = async ({ session, fetch, params }) => {
		const platesResponse = await fetch(`${PUBLIC_API_BASE}/plates/${params.id}`);
		const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

		if (platesResponse.status == 404) {
			return { status: 404, error: "plate doesn't exist" };
		}

		const plate: FullPlate = await platesResponse.json();
		const categories: Category[] = await categoriesResponse.json();

		const reviewStores = storeReviews(plate.model.reviews, plate.modelId, session.user?.id);

		const userReview = reviewStores.userReview;
		const editorialReview = reviewStores.editorialReview;
		const allReviews = reviewStores.allReviews;

		const scoreStores = storeScores(
			plate.model.scores,
			plate.modelId,
			session.user?.id,
			categories
		);
		const userScores = scoreStores.userScores;
		const editorialScores = scoreStores.editorialScores;
		const allScores = scoreStores.allScores;

		return {
			props: {
				categories,
				plate,
				user: session.user,
				userReview,
				editorialReview,
				allReviews,
				userScores,
				editorialScores,
				allScores
			}
		};
	};
</script>

<script lang="ts">
	import { derived, get, type Writable } from 'svelte/store';
	import type { Category, Review, Score, User } from '@prisma/client';
	import { session } from '$app/stores';
	import { goto, invalidate } from '$app/navigation';

	import type { FullPlate } from '$lib/database/models';
	import { reviewDescriptionInputName, reviewIdInputName } from './review/_form';

	import { storeScores } from '$lib/api/scores';
	import { storeReviews, handleDeleteReview, handleSubmitReview } from '$lib/api/reviews';

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ReviewCard from '$lib/components/ReviewCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	export let categories: Category[];
	export let plate: FullPlate;
	export let user: User;

	export let userReview: Writable<Review>;
	export let editorialReview: Writable<Review>;
	export let allReviews: Writable<
		Review & {
			user: User;
		}
	>[];

	export let userScores: {
		[categoryId: number]: Writable<Score>;
	};
	export let editorialScores: {
		[categoryId: number]: Writable<Score>;
	};
	export let allScores: {
		[categoryId: number]: Writable<Score>[];
	};

	const submitReviewFormId = 'userReview';
	const deleteReviewFormId = 'delete';
	const reviewTextareaId = 'review';

	const scoreUrl = `/plates/${plate.modelId}/scores/`;

	let description: string = get(userReview).description;

	$: submitMessage = $userReview.id ? 'update' : 'submit';

	$: allReviewsStores = allReviews.map((review) => get(review));
</script>

<svelte:head>
	<title>{plate.jurisdiction.name} plate ({plate.startYear || '?'}-{plate.endYear || '?'})</title>
</svelte:head>

<Section>
	<PlateCard {plate} isAdmin={user?.isAdmin} small={false} />

	<ScoreSheet {categories} {editorialScores} graphScores={allScores} />

	{#if $editorialReview.description}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{$editorialReview.description}</textarea>
		</div>
	{/if}
</Section>

<Divider horizontal={true} />

<Section title="user review">
	{#if $session.user}
		<form hidden id={submitReviewFormId} action={`/plates/${plate.modelId}/review`} method="post" />
		<form
			hidden
			id={deleteReviewFormId}
			action={`/plates/${plate.modelId}/review/delete`}
			method="post"
		/>

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
			bind:value={description}
		/>

		<input hidden form={deleteReviewFormId} name={reviewIdInputName} value={$userReview.id} />
		<div class="break-container">
			<button
				class="border inset shadow good no-select"
				type="submit"
				form={submitReviewFormId}
				on:click|preventDefault={async () => {
					const invalidateUrl = await handleSubmitReview(description, userReview, plate.modelId);
					invalidate(invalidateUrl);
				}}
			>
				{submitMessage}
			</button>
			<button
				class="border inset shadow bad no-select"
				type="submit"
				form={deleteReviewFormId}
				on:click|preventDefault={async () => {
					const invalidateUrl = await handleDeleteReview(userReview, plate.modelId);
					invalidate(invalidateUrl);
				}}
			>
				delete
			</button>
		</div>
	{:else}
		<a
			class="border inset shadow good no-select link-box"
			href="/login"
			on:click|preventDefault={() => goto(`/login?redirectUrl=/plates/${plate.modelId}`)}
		>
			login
		</a>
	{/if}
</Section>

<Divider horizontal={true} />

<Section title="reviews">
	<CardsGrid>
		{#each allReviewsStores as review}
			<ReviewCard user={review.user} {categories} {review} scores={allScores} />
		{/each}
	</CardsGrid>
</Section>

<style>
	.break-container {
		width: 100%;
		flex-basis: 100%;
		display: flex;
		justify-content: center;

		gap: 1rem;
	}
	textarea {
		width: 90%;
		max-width: 80rem;
		resize: none;

		border-radius: 0.6rem;

		font-family: 'Lora';
		font-weight: normal;
	}
</style>
