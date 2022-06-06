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

	import { storeScores } from '$lib/api/scores';
	import { storeReviews, handleDeleteReview, handleSubmitReview } from '$lib/api/reviews';

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ReviewCard from '$lib/components/ReviewCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';
	import { derived, get } from 'svelte/store';

	export let categories: Category[];
	export let plate: FullPlate;
	export let user: User;

	let { userReviewStore, editorialReviewStore, allReviewStores } = storeReviews(
		plate.model.reviews,
		plate.modelId,
		user?.id
	);

	let { userScoreStores, editorialScoreStores, allScoreStores } = storeScores(
		plate.model.scores,
		plate.modelId,
		user?.id,
		categories
	);

	const submitReviewFormId = 'userReview';
	const deleteReviewFormId = 'delete';
	const reviewTextareaId = 'review';

	const scoreUrl = `/plates/${plate.modelId}/scores/`;

	let description: string = get(userReviewStore).description;

	const allReviewsStore = derived(allReviewStores, (reviews) => {
		return reviews;
	});
</script>

<svelte:head>
	<title>{plate.jurisdiction.name} plate ({plate.startYear || '?'}-{plate.endYear || '?'})</title>
</svelte:head>

<Section>
	<PlateCard {plate} isAdmin={user?.isAdmin} small={false} />

	<ScoreSheet {categories} editorialScores={editorialScoreStores} graphScores={allScoreStores} />

	{#if $editorialReviewStore.description}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{$editorialReviewStore.description}</textarea>
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

		<ScoreSheet {categories} userScores={userScoreStores} {scoreUrl} />

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

		<input hidden form={deleteReviewFormId} name={reviewIdInputName} value={$userReviewStore.id} />
		<div class="break-container">
			<button
				class="border inset shadow good no-select"
				type="submit"
				form={submitReviewFormId}
				on:click|preventDefault={async () => {
					const invalidateUrl = await handleSubmitReview(
						description,
						userReviewStore,
						plate.modelId
					);
					invalidate(invalidateUrl);
				}}
			>
				submit
			</button>
			<button
				class="border inset shadow bad no-select"
				type="submit"
				form={deleteReviewFormId}
				on:click|preventDefault={async () => {
					const invalidateUrl = await handleDeleteReview(userReviewStore, plate.modelId);
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
		{#each $allReviewsStore as review}
			<ReviewCard user={review.user} {categories} {review} scores={allScoreStores} />
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
