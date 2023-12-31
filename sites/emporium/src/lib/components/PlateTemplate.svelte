<script lang="ts">
	import type { Jurisdiction, FullPlate } from '$db/schema';

	import { Card, Interactable } from '@pierogis/utensils';

	export let jurisdictions: Jurisdiction[];
	export let plate: FullPlate | null = null;
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
		class="jurisdiction border inset"
		list="jurisdictions"
		name="jurisdiction"
		required
		maxlength="2"
		placeholder="oh"
		value={plate ? plate.jurisdiction.id : ''}
	/>

	<datalist id="jurisdictions">
		{#each jurisdictions as jurisdiction}
			<option value={jurisdiction.id}>{jurisdiction.abbreviation}</option>
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
		class="border inset"
		name="imageUrl"
		value={plate?.model.images ? plate.model.images[0]?.url || '' : ''}
		placeholder="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
	/>

	<span>
		<input
			type="text"
			class="year border inset"
			name="startYear"
			value={plate ? plate.startYear : ''}
			placeholder="2016"
			maxlength="4"
		/>-<input
			type="text"
			class="year border inset"
			name="endYear"
			value={plate ? plate.endYear : ''}
			placeholder="2022"
			maxlength="4"
		/>
	</span>
	<Interactable>
		<button class="border inset no-select" formmethod="post">submit</button>
	</Interactable>
</Card>

<style>
	.delete {
		position: absolute;
		display: flex;

		background-color: transparent;

		top: 10px;
		right: 10px;
	}

	.back {
		position: absolute;
		display: flex;

		background-color: transparent;

		top: 10px;
		left: 10px;
	}

	input[type='text'].jurisdiction {
		width: 4em;
	}
	input[type='text'].year {
		width: 4em;
	}
	input[type='url'] {
		width: 20em;
	}
</style>
