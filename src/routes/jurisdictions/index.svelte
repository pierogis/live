<script lang="ts">
	import type { Plate } from '$lib/models';

	import Plates from '$lib/components/Plates.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let jurisdictions: { [key: string]: Plate };
</script>

<Plates grid={true}>
	{#each Object.entries(jurisdictions) as [jurisdiction, plate]}
		<PlateCard {plate} showJurisdiction={true} showYears={false} showScores={false} />
	{/each}
</Plates>
