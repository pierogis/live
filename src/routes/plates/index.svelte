<script lang="ts">
	import type { Plate } from '@prisma/client';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let plates: Plate[];
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} small={true} />
	{/each}
</CardsGrid>
