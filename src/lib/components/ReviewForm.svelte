<script lang="ts">
	import { get, type Writable } from 'svelte/store';

	import {
		reviewDescriptionInputName,
		reviewIdInputName,
		reviewUserIdInputName
	} from '$lib/forms/review';

	import type { Review } from '@prisma/client';
	import type { FullPlate } from '$lib/models';

	export let plate: FullPlate;
	export let review: Writable<Review>;

	const reviewFormId = 'userReview';
	const reviewTextareaId = 'review';

	$: originalDescription = get(review).description;
	$: description = originalDescription;

	$: submitMessage = $review.id ? 'update' : 'submit';
</script>

<form hidden id={reviewFormId} action={`/plates/${plate.modelId}/review?/update`} method="post" />

<label hidden for={reviewTextareaId}>review</label>
<textarea
	id={reviewTextareaId}
	class="inset"
	form={reviewFormId}
	name={reviewDescriptionInputName}
	required
	type="text"
	rows="10"
	bind:value={description}
/>

<input hidden form={reviewFormId} name={reviewIdInputName} value={$review.id} />
<input hidden form={reviewFormId} name={reviewUserIdInputName} value={$review.userId} />
<div class="break-container">
	<button
		class="border inset shadow good no-select"
		type="submit"
		form={reviewFormId}
		on:click={() => {
			$review = { ...$review, description };
		}}
	>
		{submitMessage}
	</button>
	<button
		class="border inset shadow bad no-select"
		type="submit"
		form={reviewFormId}
		formaction={`/plates/${plate.modelId}/review?/delete`}
	>
		delete
	</button>
</div>

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
