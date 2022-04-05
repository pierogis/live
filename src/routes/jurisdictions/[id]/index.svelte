<script lang="ts" context="module">
	/** @type {import('./jurisdictions/[id]').Load} */
	export async function load({ props }) {
		if (!props.jurisdiction) {
			return { status: 404, error: "jurisdiction doesn't exist" };
		}

		return {
			props: { ...props }
		};
	}
</script>

<script lang="ts">
	import type { Jurisdiction } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let jurisdiction: Jurisdiction & {
		plates: FullPlate[];
	};
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="top">
	<div class="jurisdiction-plates">
		<CardsGrid>
			{#each jurisdiction.plates as plate}
				<PlateCard {plate} small={true} />
			{/each}
		</CardsGrid>
	</div>

	<div class="divider" />

	<div class="jurisdiction-description">Ah, the sunshine jurisdiction.</div>
</div>

<style>
	.top {
		width: 90%;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;
	}

	.jurisdiction-description {
		flex: 1;
		padding: 2rem;
		font-family: 'Lora';
		font-weight: normal;
	}
	.jurisdiction-plates {
		flex: 3;
		padding: 1.2rem;
	}
</style>
