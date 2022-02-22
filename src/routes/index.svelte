<script lang="ts">
	import type { Plate } from '$lib/plates';

	import Filters from '$lib/Filters.svelte';
	import PlateCard from '$lib/PlateCard.svelte';
	import Plates from '$lib/Plates.svelte';

	export let plates: Plate[];
</script>

<div class="filters">
	<Filters />
</div>

<Plates grid={true}>
	{#each plates as plate}
		<PlateCard {plate} />
	{/each}
</Plates>
