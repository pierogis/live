<script lang="ts">
	import type { Plate } from '$lib/database/models';

	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let jurisdictionsPlate: { [key: string]: Plate };
</script>

<CardsGrid>
	{#each Object.entries(jurisdictionsPlate) as [jurisdiction, plate]}
		<PlateCard {plate} showJurisdiction={true} showYears={false} showScores={false} />
	{/each}
</CardsGrid>
