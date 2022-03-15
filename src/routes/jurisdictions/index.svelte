<script lang="ts">
	import type { Jurisdiction, Plate } from '@prisma/client';

	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let plates: (Plate & {
		jurisdiction: Jurisdiction;
	})[];
</script>

<svelte:head>
	<title>jurisdictions</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} showYears={false} small={true} />
	{/each}
</CardsGrid>
