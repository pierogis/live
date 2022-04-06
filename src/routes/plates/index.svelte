<script lang="ts">
	import type { FullPlate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let plates: FullPlate[];
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} small={true} />
	{/each}
</CardsGrid>
