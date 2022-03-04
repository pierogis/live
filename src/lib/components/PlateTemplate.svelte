<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import DropZone from '$lib/components/DropZone.svelte';
	import type { Jurisdiction } from '$lib/database/models';
	import Scores from './Scores.svelte';

	export let jurisdictions: Jurisdiction[];
</script>

<form action="">
	<Card>
		<input class="jurisdiction" list="jurisdictions" />

		<datalist id="jurisdictions">
			{#each jurisdictions as jurisdiction}
				<option value={jurisdiction.abbreviation} />
			{/each}
		</datalist>

		<div class="image">
			<DropZone />
		</div>

		<span><input class="year" />-<input class="year" /></span>
		<Scores scores={[]} />
		<button type="submit" method="post">✅</button>
	</Card>
</form>

<style>
	input {
		font-family: 'Courier', monospace;
		width: 128px;
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
		max-height: 196px;

		display: flex;
		justify-content: center;
	}
</style>
