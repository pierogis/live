<!-- jurisdictions/[id=integer].svelte -->
<script lang="ts" context="module">
	/** @type {import('./jurisdictions/[id=integer]').Load} */
	export async function load({ fetch, params }) {
		const jurisdictionResponse = await fetch(`/api/jurisdictions/${params.id}`);
		const categoriesResponse = await fetch(`/api/plates/categories`);

		const jurisdiction: Jurisdiction & {
			plates: FullPlate[];
		} = await jurisdictionResponse.json();

		const categories: Category[] = await categoriesResponse.json();

		if (!jurisdiction) {
			return { status: 404, error: "jurisdiction doesn't exist" };
		}

		return {
			props: { jurisdiction, categories }
		};
	}
</script>

<script lang="ts">
	import type { Category, Jurisdiction } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import { handleChangeScore } from '$lib/api/scores';
	import { session } from '$app/stores';

	export let jurisdiction: Jurisdiction & {
		plates: FullPlate[];
	};
	export let categories: Category[];
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="top">
	<CardsGrid>
		{#each jurisdiction.plates as plate}
			<PlateCard {plate} small={true}>
				<ScoreSheet
					scores={plate.model.scores}
					{categories}
					handleChangeScore={(value, categoryId) =>
						handleChangeScore(value, categoryId, $session.user?.id, plate.modelId)}
				/>
			</PlateCard>
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
