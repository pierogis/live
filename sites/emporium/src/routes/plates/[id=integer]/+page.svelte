<script lang="ts">
	import { CardsGrid, Divider, Interactable, Section } from '@pierogis/utensils';

	import { PlateCard, ReviewCard, ScoreSheet, ReviewForm } from '$lib/components';

	let { data } = $props();

	let scoreUrl = $derived(`/plates/${data.plate.modelId}/scores/`);

	let allReviewsStores = $derived(data.allReviews.map((review) => review));

	let userReview = $derived(data.userReview);
	let editorialReview = $derived(data.editorialReview);

	let description = $state($userReview.description);
</script>

<Section>
	<PlateCard plate={data.plate} isAdmin={data.sessionUser?.isAdmin} small={false} />

	<ScoreSheet
		interactive={false}
		categories={data.categories}
		editorialScores={data.editorialScores}
		graphScores={data.allScores}
	/>

	{#if $editorialReview.description}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{$editorialReview.description}</textarea>
		</div>
	{/if}
</Section>

<Divider horizontal={true} size="0.4rem" />

<Section column rowGap="0.5rem">
	{#snippet title()}
		<h3>user review</h3>
	{/snippet}
	{#if data.sessionUser !== null}
		<ScoreSheet categories={data.categories} userScores={data.userScores} {scoreUrl} />
		<ReviewForm plate={data.plate} data={data.reviewForm} bind:description />
	{:else}
		{@const loginUrl = `/login?redirectUrl=/plates/${data.plate.modelId}`}
		<Interactable>
			<a class="border inset good no-select link-box" href={loginUrl}>login</a>
		</Interactable>
	{/if}
</Section>

<Divider horizontal={true} size="0.4rem" />

<Section column>
	{#snippet title()}
		<h3>reviews</h3>
	{/snippet}

	<CardsGrid>
		{#each allReviewsStores as review (review)}
			<ReviewCard categories={data.categories} {review} scores={data.allScores} />
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
