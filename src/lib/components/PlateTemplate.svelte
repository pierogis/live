<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import type { Jurisdiction, Plate } from '$lib/database/models';
	import Scores from './Scores.svelte';

	export let jurisdictions: Jurisdiction[];
	export let plate: Plate = null;
</script>

<Card>
	<input
		type="text"
		class="jurisdiction border shadow"
		list="jurisdictions"
		name="jurisdiction"
		maxlength="2"
		value={plate ? plate.jurisdiction : ''}
	/>

	<datalist id="jurisdictions">
		{#each jurisdictions as jurisdiction}
			<option value={jurisdiction.abbreviation} />
		{/each}
	</datalist>

	<div class="image-input">
		<DropZone />
	</div>

	<span>
		<input
			type="text"
			class="year border shadow"
			name="startYear"
			value={plate ? plate.startYear : ''}
			maxlength="4"
		/>-<input
			type="text"
			class="year border shadow"
			name="endYear"
			value={plate ? plate.endYear : ''}
			maxlength="4"
		/>
	</span>
	<Scores scores={[]} />
	<input class="border shadow" type="submit" method="post" value="submit" />
</Card>

<style>
	input[type='text'] {
		padding: 0.1rem 0.2rem;
	}
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
	input[type='submit'],
	button {
		font-family: monospace;
		padding: 12px;
		background-color: var(--primary-color);
		color: var(--text-color);
		font-weight: bold;

		cursor: pointer;
	}
</style>
