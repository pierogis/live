<script lang="ts">
	import type { Plate } from '$lib/plates';

	import Filters from '$lib/Filters.svelte';
	import PlateCard from '$lib/PlateCard.svelte';

	export let plates: Plate[];
</script>

<div class="filters">
	<Filters />
</div>

<div class="plates">
	{#each plates as plate}
		<PlateCard {plate} />
	{/each}
</div>

<style>
	.plates {
		display: grid;
		grid-template-columns: 1fr;
		gap: 40px;
		margin: 20px;

		justify-items: center;
	}
	@media only screen and (min-width: 400px) {
		.plates {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media only screen and (min-width: 700px) {
		.plates {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
