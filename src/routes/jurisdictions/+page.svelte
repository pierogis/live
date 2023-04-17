<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	export let data;
</script>

<svelte:head>
	<title>jurisdictions</title>
</svelte:head>

<CardsGrid>
	{#each data.plates as plate}
		<PlateCard {plate} showYears={false} small={true} />
	{/each}
</CardsGrid>
