<script lang="ts">
	import type { Jurisdiction } from '@prisma/client';

	import type { FullPlate } from '$lib/models';

	import { Card } from '@pierogis/utensils';

	export let jurisdictions: Jurisdiction[];
	export let plate: FullPlate = null;
</script>

<Card>
	{#if plate}
		<a class="back" href={`/plates/${plate.modelId}`}>🔙</a>
		<input
			class="delete no-select"
			type="submit"
			formaction={`/plates/${plate.modelId}/edit?/delete`}
			value="❌"
		/>
	{/if}

	<input
		type="text"
		class="jurisdiction border inset shadow"
		list="jurisdictions"
		name="jurisdiction"
		required
		maxlength="2"
		placeholder="oh"
		value={plate ? plate.jurisdiction.abbreviation : ''}
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
		value={plate?.model.images ? plate.model.images[0]?.url || '' : ''}
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
	<input class="border inset shadow no-select" type="submit" method="post" value="submit" />
</Card>

<style>
	.delete {
		position: absolute;
		display: flex;

		background-color: transparent;

		top: 0;
		right: 0.4rem;
	}

	.back {
		position: absolute;
		display: flex;

		background-color: transparent;

		top: 0;
		left: 0.4rem;
	}

	input[type='text'].jurisdiction {
		width: 2em;
	}
	input[type='text'].year {
		width: 3em;
	}
	input[type='url'] {
		width: 20em;
	}
</style>
