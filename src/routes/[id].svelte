<script lang="ts">
	import PlateCard from '$lib/PlateCard.svelte';
	import Plates from '$lib/Plates.svelte';
	import type { Plate } from '$lib/plates';

	export let plate: Plate;
	console.log(plate);

	// ...plus props from `post` when the page is rendered
	// in response to a POST request, for example after
	// submitting the form below
	export let errors;
</script>

<Plates grid={false}><PlateCard {plate} /></Plates>

<!-- <form method="post">
	<input name="title" />

	{#if errors?.title}
		<p class="error">{errors.title}</p>
	{/if}

	<button type="submit">Create review</button>
</form> -->
