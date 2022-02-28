<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import type { Plate } from '$lib/database/plate';

	export let plates: Plate[];
</script>

<div class="jurisdiction">
	<div class="jurisdiction-description">Ah, the sunshine jurisdiction</div>

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
		padding: 16px;
		font-size: 0.8em;
	}
	.jurisdiction-plates {
		flex: 3;
		border-left: 10px solid var(--accent-color);
	}
</style>
