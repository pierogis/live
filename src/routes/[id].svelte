<script lang="ts">
	import PlateCard from '$lib/PlateCard.svelte';
	import type { Plate } from '$lib/plates';

	export let plate: Plate;

	// ...plus props from `post` when the page is rendered
	// in response to a POST request, for example after
	// submitting the form below
	export let errors;
</script>

<div class="card-wrapper"><PlateCard {plate} /></div>

<!-- <form method="post">
	<input name="title" />

	{#if errors?.title}
		<p class="error">{errors.title}</p>
	{/if}

	<button type="submit">Create review</button>
</form> -->
<style>
	.card-wrapper {
		margin: 20px;
		display: flex;
		justify-content: center;
	}
</style>
