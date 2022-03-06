<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import type { Plate } from '$lib/database/models';

	export let plate: Plate;
	export let showAdmin: boolean;

	// ...plus props from `post` when the page is rendered
	// in response to a POST request, for example after
	// submitting the form below
	// export let errors;
</script>

<svelte:head>
	<title>{'plate ' + plate.id}</title>
</svelte:head>

<PlateCard {plate} {showAdmin} />

<!-- <form method="post">
	<input name="title" />

	{#if errors?.title}
		<p class="error">{errors.title}</p>
	{/if}

	<button type="submit">Create review</button>
</form> -->
