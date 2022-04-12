<!-- jurisdictions/[id=integer]/index.svelte -->
<script lang="ts" context="module">
	/** @type {import('./jurisdictions/[id=integer]').Load} */
	export async function load({ fetch, params }) {
		const response = await fetch(`/api/jurisdictions/${params.id}`);

		const jurisdiction: Jurisdiction & {
			plates: FullPlate[];
		} = await response.json();

		console.log(jurisdiction);

		if (!jurisdiction) {
			return { status: 404, error: "jurisdiction doesn't exist" };
		}

		return {
			props: { jurisdiction }
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
	<CardsGrid>
		{#each jurisdiction.plates as plate}
			<PlateCard {plate} small={true} />
		{/each}
	</CardsGrid>
</div>

<style>
	.top {
		width: 90%;

		display: flex;
		flex-direction: row;

		justify-content: center;
		align-items: center;
	}
</style>
