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
	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import type { Jurisdiction, Plate } from '@prisma/client';

	export let jurisdiction: Jurisdiction & {
		plates: Plate[];
	};
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="jurisdiction-description">Ah, the sunshine jurisdiction.</div>

<div class="divider" />

<div class="jurisdiction-plates">
	<CardsGrid>
		{#each jurisdiction.plates as plate}
			<PlateCard {plate} small={true} />
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
