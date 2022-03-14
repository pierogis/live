<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import type { Jurisdiction, Plate } from '$lib/database/models';

	export let jurisdiction: Jurisdiction;
	export let plates: Plate[];
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="jurisdiction-description">Ah, the sunshine jurisdiction.</div>

<div class="divider" />

<div class="jurisdiction-plates">
	<CardsGrid>
		{#each plates as plate}
			<PlateCard {plate} showJurisdiction={false} small={true} />
		{/each}
	</CardsGrid>
</div>

<style>
	.jurisdiction-description {
		flex: 1;
		padding: 0.4rem;
		font-family: 'Lora';
		font-weight: normal;
	}
	.jurisdiction-plates {
		flex: 3;
		padding: 1.2rem;
	}
</style>
