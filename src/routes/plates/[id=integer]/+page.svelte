<script lang="ts">
	import { get } from 'svelte/store';
	import { goto, invalidate } from '$app/navigation';

	import { reviewDescriptionInputName, reviewIdInputName } from './review/_form';

	import { handleDeleteReview, handleSubmitReview } from '$lib/api/reviews';

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ReviewCard from '$lib/components/ReviewCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({
		categories,
		plate,
		user,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores
	} = data);

	const submitReviewFormId = 'userReview';
	const deleteReviewFormId = 'delete';
	const reviewTextareaId = 'review';

	$: scoreUrl = `/plates/${plate.modelId}/scores/`;

	$: originalDescription = get(userReview).description;
	$: description = originalDescription;

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

<Divider horizontal={true} size={'0.4rem'} />

<Section title="user review" column>
	{#if user}
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

<Divider horizontal={true} size={'0.4rem'} />

<Section title="reviews" column>
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
	}
</style>
