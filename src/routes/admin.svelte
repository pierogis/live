<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import type { Jurisdiction } from '$lib/database/jurisdiction';

	export let jurisdictions: Jurisdiction[];
</script>

<Card>
	<span>
		<input class="jurisdiction" list="jurisdictions" />

		<datalist id="jurisdictions">
			{#each jurisdictions as jurisdiction}
				<option value={jurisdiction.abbreviation} />
			{/each}
		</datalist>
	</span>

	<span><input class="image" type="file" /><img id="blah" src="#" alt="plate image" /></span>

	<span><input class="year" />-<input class="year" /></span>
	<!-- <Scores plateId={plate.id} reviews={plate.reviews} /> -->
</Card>

<style>
	input {
		font-family: 'Courier', monospace;
		width: 100px;
		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		border-radius: 5%;

		background-color: whitesmoke;
	}

	.jurisdiction {
		width: 2em;
	}
	.year {
		width: 3em;
	}

	.image {
		margin: 4px;
	}
</style>
