<script lang="ts">
	import { goto } from '$app/navigation';

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import { storeScores } from '$lib/api/scores';
	import { storeReviews } from '$lib/api/reviews';

	import { PlateCard, ReviewCard, ScoreSheet, ReviewForm } from '$lib/components';

	export let data;

	const reviewStores = storeReviews(
		data.plate.model.reviews,
		data.plate.modelId,
		data.sessionUser?.id
	);

	const userReview = reviewStores.userReview;
	const editorialReview = reviewStores.editorialReview;
	const allReviews = reviewStores.allReviews;

	const scoreStores = storeScores(
		data.plate.model.scores,
		data.plate.modelId,
		data.sessionUser?.id,
		data.categories,
		fetch
	);

	const userScores = scoreStores.userScores;
	const editorialScores = scoreStores.editorialScores;
	const allScores = scoreStores.allScores;

	$: scoreUrl = `/plates/${data.plate.modelId}/scores/`;

	$: allReviewsStores = allReviews.map((review) => review);
</script>

<svelte:head>
	<title>
		{data.plate.jurisdiction.name} plate ({data.plate.startYear || '?'}-{data.plate.endYear || '?'})
	</title>
</svelte:head>

<Section>
	<PlateCard plate={data.plate} isAdmin={data.sessionUser?.isAdmin} small={false} />

	<ScoreSheet categories={data.categories} {editorialScores} graphScores={allScores} />

	{#if $editorialReview.description}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{$editorialReview.description}</textarea>
		</div>
	{/if}
</Section>

<Divider horizontal={true} size={'0.4rem'} />

<Section title="user review" column rowGap={'0.5rem'}>
	{#if data.sessionUser}
		<ScoreSheet categories={data.categories} {userScores} {scoreUrl} />
		<ReviewForm plate={data.plate} review={userReview} />
	{:else}
		{@const loginUrl = `/login?redirectUrl=/plates/${data.plate.modelId}`}
		<a
			class="border inset shadow good no-select link-box"
			href={loginUrl}
			on:click|preventDefault={() => goto(loginUrl)}
		>
			login
		</a>
	{/if}
</Section>

<Divider horizontal={true} size={'0.4rem'} />

<Section title="reviews" column>
	<CardsGrid>
		{#each allReviewsStores as review}
			<ReviewCard categories={data.categories} {review} scores={allScores} />
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
