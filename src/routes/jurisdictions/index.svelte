<!-- jurisdictions/index.svelte -->
<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';

	import type { Load } from './__types';
	export const load: Load = async ({ fetch }) => {
		const request = await fetch(`${PUBLIC_API_BASE}/plates?distinct=jurisdictionId`);

		const plates = await request.json();

		return {
			props: { plates }
		};
	};
</script>

<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

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
