<script lang="ts">
	import type { Plate } from '@prisma/client';

	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let jurisdictionsPlate: { [key: string]: Plate };
</script>

<svelte:head>
	<title>jurisdictions</title>
</svelte:head>

<CardsGrid>
	{#each Object.entries(jurisdictionsPlate) as [jurisdiction, plate]}
		<PlateCard {plate} showJurisdiction={true} showYears={false} showScores={false} small={true} />
	{/each}
</CardsGrid>
