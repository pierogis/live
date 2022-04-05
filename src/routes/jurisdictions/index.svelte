<script lang="ts">
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';
	import type { FullPlate } from '$lib/database/models';

	export let plates: FullPlate[];
</script>

<svelte:head>
	<title>jurisdictions</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} showYears={false} small={true} />
	{/each}
</CardsGrid>
