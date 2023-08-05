<script lang="ts">
	import { CardsGrid, Divider, Interactable, Section } from '@pierogis/utensils';

	import { PlateCard, ReviewCard, ScoreSheet, ReviewForm } from '$lib/components';

	export let data;
	$: ({
		categories,
		plate,
		userReview,
		reviewForm,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores,
		sessionUser
	} = data);

	$: scoreUrl = `/plates/${plate.modelId}/scores/`;

	$: allReviewsStores = allReviews.map((review) => review);
</script>

<svelte:head>
	<title>
		{plate.jurisdiction.name} plate ({plate.startYear || '?'}-{plate.endYear || '?'})
	</title>
</svelte:head>

<Section>
	<PlateCard {plate} isAdmin={sessionUser?.isAdmin} small={false} />

	<ScoreSheet {categories} {editorialScores} graphScores={allScores} />

	{#if $editorialReview.description}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{$editorialReview.description}</textarea>
		</div>
	{/if}
</Section>

<Divider horizontal={true} size={'0.4rem'} />

<Section title="user review" column rowGap={'0.5rem'}>
	{#if sessionUser !== null}
		<ScoreSheet {categories} {userScores} {scoreUrl} />
		<ReviewForm {plate} data={reviewForm} bind:description={$userReview.description} />
	{:else}
		{@const loginUrl = `/login?redirectUrl=/plates/${plate.modelId}`}
		<Interactable>
			<a class="border inset good no-select link-box" href={loginUrl}>login</a>
		</Interactable>
	{/if}
</Section>

<Divider horizontal={true} size={'0.4rem'} />

<Section title="reviews" column>
	<CardsGrid>
		{#each allReviewsStores as review}
			<ReviewCard {categories} {review} scores={allScores} />
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
