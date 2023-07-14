<script lang="ts">
	import type { SuperValidated } from 'sveltekit-superforms';
	import { superForm } from 'sveltekit-superforms/client';

	import type { schema } from '$lib/forms/review';

	import type { FullPlate } from '$db/schema';

	export let plate: FullPlate;

	export let data: SuperValidated<typeof schema>;

	const { form, errors, enhance, constraints, capture, restore } = superForm(data);

	export const snapshot = {
		capture,
		restore
	};

	const reviewFormId = 'userReview';
	const reviewTextareaId = 'review';

	// allow parent to watch
	export let description = $form.description;

	$: submitMessage = $form.id ? 'update' : 'submit';
</script>

<form
	hidden
	id={reviewFormId}
	action={`/plates/${plate.modelId}/review?/update`}
	method="post"
	use:enhance
/>

<label hidden for={reviewTextareaId}>review</label>
<textarea
	class="inset"
	form={reviewFormId}
	rows="10"
	name="description"
	data-invalid={$errors.description}
	bind:value={$form.description}
	{...$constraints.description}
/>

<!-- id -->
<input
	hidden
	form={reviewFormId}
	name="id"
	data-invalid={$errors.id}
	bind:value={$form.id}
	{...$constraints.id}
/>
<!-- userId -->
<input
	hidden
	form={reviewFormId}
	name="userId"
	data-invalid={$errors.userId}
	bind:value={$form.userId}
	{...$constraints.userId}
/>

<div class="break-container">
	<button
		class="border inset shadow good no-select"
		type="submit"
		form={reviewFormId}
		on:click={() => {
			description = $form.description;
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
