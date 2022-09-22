<script lang="ts">
	import { goto } from '$app/navigation';

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ReviewCard from '$lib/components/ReviewCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';
	import ReviewForm from '$lib/components/ReviewForm.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({
		categories,
		plate,
		sessionUser,
		userReview,
		editorialReview,
		allReviews,
		userScores,
		editorialScores,
		allScores
	} = data);

	$: scoreUrl = `/plates/${plate.modelId}/scores/`;

	$: allReviewsStores = allReviews.map((review) => review);
</script>

<svelte:head>
	<title>{plate.jurisdiction.name} plate ({plate.startYear || '?'}-{plate.endYear || '?'})</title>
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

<Section title="user review" column>
	{#if sessionUser}
		<ScoreSheet {categories} {userScores} {scoreUrl} />
		<ReviewForm {plate} review={userReview} />
	{:else}
		{@const loginUrl = `/login?redirectUrl=/plates/${plate.modelId}`}
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
