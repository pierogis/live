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
</style>
