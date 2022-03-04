<script lang="ts">
	import type { Plate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let plates: Plate[];
	export let showAdmin: boolean;
</script>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} {showAdmin} />
	{/each}
</CardsGrid>
