<script lang="ts">
	import type { Plate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let plates: Plate[];

	export let showAdmin;
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} {showAdmin} />
	{/each}
</CardsGrid>
