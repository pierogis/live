<script lang="ts">
	import type { Plate } from '$lib/database/plate';

	import PlatesGrid from '$lib/components/PlatesGrid.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let jurisdictions: { [key: string]: Plate };
</script>

<PlatesGrid grid={true}>
	{#each Object.entries(jurisdictions) as [jurisdiction, plate]}
		<PlateCard {plate} showJurisdiction={true} showYears={false} showScores={false} />
	{/each}
</PlatesGrid>
