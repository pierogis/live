<!-- jurisdictions/index.svelte -->
<script lang="ts" context="module">
	/** @type {import('./jurisdictions/index').Load} */
	export async function load({ fetch }) {
		const request = await fetch('/api/plates?distinct=jurisdictionId');

		const plates = await request.json();

		return {
			props: { plates }
		};
	}
</script>

<script lang="ts">
	import CardsGrid from '@pierogis/utensils/CardsGrid.svelte';
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
