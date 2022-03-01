<script lang="ts">
	import type { Plate } from '$lib/database/plate';
	import type { Jurisdiction } from '$lib/database/jurisdiction';
	import type { Score } from '$lib/database/review';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let plates: Plate[];
	export let jurisdictions: Jurisdiction[];
</script>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} />
	{/each}
	<PlateTemplate {jurisdictions} />
</CardsGrid>
