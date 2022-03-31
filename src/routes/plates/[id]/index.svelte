<script lang="ts" context="module">
	/** @type {import('./plates/[id]/index').Load} */
	export async function load({ props, session }) {
		if (!props.plate) {
			return { status: 404, error: "plate doesn't exist" };
		}

		return {
			props: { plate: props.plate, user: session.user }
		};
	}
</script>

<script lang="ts">
	import { session } from '$app/stores';
	import PlateCard from '$lib/components/PlateCard.svelte';
	import Review from '$lib/components/Review.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';
	import type { FullPlate } from '$lib/database/models';
	import type { User } from '@prisma/client';

	export let plate: FullPlate;
	export let user: User;

	const editorialReview = plate.reviews.find((review) => review.user.id == 1);
	const editorialScores = plate.scores.filter((score) => score.userId == 1);

	const userReview = plate.reviews.find((review) => review.user.id == user?.id);
	const userScores = plate.scores.filter((score) => score.userId == user?.id);

	const reviewFormId = 'review';
	const editorialTextareaId = 'editorial';
</script>

<svelte:head>
	<title>{'plate: ' + plate.id}</title>
</svelte:head>

<div class="top">
	<div class="plate">
		<PlateCard {plate} isAdmin={user?.isAdmin} small={false} />
	</div>

	{#if editorialReview}
		<div class="editorial">
			{editorialReview?.description || ''}
		</div>
	{/if}
</div>

<div class="divider horizontal" />

<div class="user-review">
	<span style:text-decoration="underline">user review</span>
	<div>
		<ScoreSheet
			scores={userScores}
			scoreUrl={`/plates/${plate.id}/scores/`}
			tooltip={false}
			graph={false}
		/>
		{#if $session.user}
			<form id={reviewFormId} action={`/plates/${plate.id}/reviews`} method="put" />
			<input hidden form={reviewFormId} type="text" name="userId" value={$session.user?.id} />
			<label hidden for={editorialTextareaId}>editorial</label>
			<textarea
				id={editorialTextareaId}
				class="border inset shadow"
				form={reviewFormId}
				type="text"
				rows="8"
				bind:value={userReview.description}
			/>
			<button class="border inset shadow good" type="submit" form={reviewFormId}>submit</button>
		{:else}
			<button action="/login" method="get">login to review</button>
		{/if}
	</div>
</div>

<div class="divider horizontal" />

<div class="reviews">
	<span style:text-decoration="underline">reviews</span>
	{#each plate.reviews as review}
		<Review {review} scores={userScores} />
	{/each}
</div>

<!-- <Reviews id="reviews"/> -->
<style>
	.top {
		width: 90%;
		padding: 1rem;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;
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
		padding: 1rem;

		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.divider.horizontal {
		height: 8px;
		width: 90vw;
		margin: 1rem;
	}

	.editorial,
	textarea {
		font-family: 'Lora';
		font-weight: normal;
	}

	.user-review {
		width: 90%;
	}

	.user-review,
	.reviews {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}

	.user-review > div {
		padding: 1rem;
		width: 90%;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;
	}

	textarea {
		margin: 2rem;
		padding: 1rem;
		line-height: 1.5;

		width: 100%;

		text-align: left;
	}

	@media only screen and (max-width: 70rem) {
		.top {
			flex-direction: column;
		}
		.user-review > div {
			flex-direction: column;
		}
	}
</style>
