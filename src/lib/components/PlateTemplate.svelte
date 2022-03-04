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
		class="jurisdiction"
		list="jurisdictions"
		name="jurisdiction"
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
		<input type="text" class="year" name="startYear" value={plate ? plate.startYear : ''} />-<input
			type="text"
			class="year"
			name="endYear"
			value={plate ? plate.endYear : ''}
		/>
	</span>
	<Scores scores={[]} />
	<input type="submit" method="post" value="✅" />
</Card>

<style>
	input[type='text'] {
		font-family: 'Courier', monospace;
		width: 128px;
		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		border-radius: 5%;

		background-color: whitesmoke;
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
</style>
