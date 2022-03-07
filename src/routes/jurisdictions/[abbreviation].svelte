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

<div class="jurisdiction">
	<div class="jurisdiction-description">Ah, the sunshine jurisdiction.</div>

	<div class="divider" />

	<div class="jurisdiction-plates">
		<CardsGrid>
			{#each plates as plate}
				<PlateCard {plate} showJurisdiction={false} />
			{/each}
		</CardsGrid>
	</div>
</div>

<style>
	.jurisdiction {
		display: flex;
		flex-direction: row;
	}
	.jurisdiction-description {
		flex: 1;
		padding: 32px;
		font-family: 'Lora';
		font-weight: normal;
	}
	.jurisdiction-plates {
		flex: 3;
	}
	.divider {
		width: 8px;
		background-color: var(--accent-color);
		border-radius: 4px;
	}
</style>
