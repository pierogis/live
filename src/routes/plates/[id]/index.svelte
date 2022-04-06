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
	import type { User } from '@prisma/client';
	import { session } from '$app/stores';

	import type { FullPlate } from '$lib/database/models';
	import { reviewDescriptionInputName } from './_form';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import Review from '$lib/components/Review.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	export let plate: FullPlate;
	export let user: User;

	const editorialReview = plate.reviews.find((review) => review.user.id == 1);
	const editorialScores = plate.scores.filter((score) => score.userId == 1);

	const emptyUserReview = {
		plateId: plate.id,
		userId: user?.id,
		description: ''
	};

	let userReview = plate.reviews.find((review) => review.user.id == user?.id) || emptyUserReview;
	const userScores = plate.scores.filter((score) => score.userId == user?.id);

	const submitReviewFormId = 'review';
	const deleteReviewFormId = 'delete';
	const reviewTextareaId = 'editorial';

	async function handleSubmitReview() {
		let formData = new FormData();

		formData.append(reviewDescriptionInputName, userReview.description);
		await fetch(`/plates/${plate.id}/reviews`, { method: 'put', body: formData });
	}

	async function handleDeleteReview() {
		await fetch(`/plates/${plate.id}/reviews`, { method: 'delete' });
		userReview = emptyUserReview;
	}
</script>

<svelte:head>
	<title>{plate.jurisdiction.name} plate ({plate.startYear}-{plate.endYear || '?'})</title>
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

<span class="section">user review</span>
{#if $session.user}
	<form
		id={submitReviewFormId}
		action={`/plates/${plate.id}/reviews?_method=PUT`}
		method="post"
		netlify
	/>
	<form
		id={deleteReviewFormId}
		action={`/plates/${plate.id}/reviews?_method=DELETE`}
		method="post"
		netlify
	/>
	<div class="user-review">
		<ScoreSheet
			scores={userScores}
			scoreUrl={`/plates/${plate.id}/scores/`}
			tooltip={false}
			graph={false}
		/>
		<label hidden for={reviewTextareaId}>editorial</label>
		<textarea
			id={reviewTextareaId}
			class="border inset shadow"
			form={submitReviewFormId}
			name={reviewDescriptionInputName}
			type="text"
			rows="8"
			bind:value={userReview.description}
		/>
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
	<button class="border inset shadow good no-select" action="/login" method="get">login</button>
{/if}

<div class="divider horizontal" />

<span class="section">reviews</span>
<div class="reviews">
	{#each plate.reviews as review}
		<Review {review} scores={userScores} />
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
