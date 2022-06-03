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

	import { CardsGrid, Divider, Section } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ReviewCard from '$lib/components/ReviewCard.svelte';
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

<Section>
	<PlateCard {plate} isAdmin={user?.isAdmin} small={false} />

	<ScoreSheet {categories} {editorialScores} {graphScores} />

	{#if editorialReview}
		<div class="break-container">
			<textarea class="inset" readonly rows="16">{editorialReview?.description || ''}</textarea>
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
			bind:value={userReview.description}
		/>

		<input hidden form={deleteReviewFormId} name={reviewIdInputName} value={userReview.id} />
		<div class="break-container">
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
		{#each plate.model.reviews as review}
			<ReviewCard {categories} {review} scores={graphScores} />
		{/each}
	</CardsGrid>
</Section>

<style>
	.break-container {
		width: 100%;
		flex-basis: 100%;
		display: flex;
		justify-content: center;
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
