<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import type { Jurisdiction, Plate } from '$lib/database/models';

	export let jurisdiction: Jurisdiction;
	export let plates: Plate[];

	const mediumColumns = 2;
	const largeColumns = 2;
	const maximumColumns = 3;
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="jurisdiction">
	<div class="jurisdiction-description">Ah, the sunshine jurisdiction.</div>

	<div class="divider" />

	<div class="jurisdiction-plates">
		<CardsGrid {mediumColumns} {largeColumns} {maximumColumns}>
			{#each plates as plate}
				<PlateCard {plate} showJurisdiction={false} />
			{/each}
		</CardsGrid>
	</div>
</div>

<style>
	.jurisdiction {
		width: 100%;
		display: flex;
		flex-direction: row;
	}
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
	.divider {
		width: 0.4rem;
		height: 100%;
		background-color: var(--accent-color);
		border-radius: 0.2rem;
	}
	@media only screen and (max-width: 640px) {
		.jurisdiction {
			flex-direction: column;
			align-items: center;
		}
		.divider {
			height: 0.4rem;
			width: 100%;
		}
	}
</style>
