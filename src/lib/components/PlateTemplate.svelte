<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import type { Jurisdiction, Plate, Image } from '@prisma/client';
	import Scores from './Scores.svelte';

	export let jurisdictions: Jurisdiction[];
	export let plate: Plate = null;
	export let images: Image[] = null;
	// export let showImageInput = false;

	// let imageInputElement: HTMLInputElement;

	// function handleImageSubmit() {
	// 	createImage(plate.id, imageInputElement.files && imageInputElement.files[0]);
	// }
</script>

<Card>
	<input
		type="text"
		class="jurisdiction border inset shadow"
		list="jurisdictions"
		name="jurisdiction"
		maxlength="2"
		placeholder="oh"
		value={plate
			? jurisdictions.find((jurisdiction) => plate.jurisdictionId == jurisdiction.id).abbreviation
			: ''}
	/>

	<datalist id="jurisdictions">
		{#each jurisdictions as jurisdiction}
			<option value={jurisdiction.abbreviation} />
		{/each}
	</datalist>

	<!-- {#if showImageInput}
		<div class="image-input">
			<DropZone bind:inputElement={imageInputElement} />
			<button on:click={handleImageSubmit} />
		</div>
	{/if} -->

	<input
		type="url"
		class="border inset shadow"
		name="imageUrl"
		value={images ? images[0].url : ''}
		placeholder="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
	/>

	<span>
		<input
			type="text"
			class="year border inset shadow"
			name="startYear"
			value={plate ? plate.startYear : ''}
			placeholder="2016"
			maxlength="4"
		/>-<input
			type="text"
			class="year border inset shadow"
			name="endYear"
			value={plate ? plate.endYear : ''}
			placeholder="2022"
			maxlength="4"
		/>
	</span>
	<Scores scores={[]} />
	<input class="border inset shadow" type="submit" method="post" value="submit" />
</Card>

<style>
	input[type='text'].jurisdiction {
		width: 2em;
	}
	input[type='text'].year {
		width: 3em;
	}
	.image-input {
		max-height: 196px;

		display: flex;
		justify-content: center;
	}
</style>
