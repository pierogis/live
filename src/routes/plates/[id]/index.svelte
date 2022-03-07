<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import type { Plate } from '$lib/database/models';

	export let plate: Plate;

	// ...plus props from `post` when the page is rendered
	// in response to a POST request, for example after
	// submitting the form below
	// export let errors;
</script>

<svelte:head>
	<title>{'plate: ' + plate.id}</title>
</svelte:head>

<PlateCard {plate} />

<div class="description">This is a description of the license plate of which we are speaking.</div>

<style>
	.description {
		font-family: 'Lora';
		font-weight: normal;
		font-size: 0.8rem;
	}
</style>
