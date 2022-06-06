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

	import { CardsGrid } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import { storeScores } from '$lib/api/scores';
	import { session } from '$app/stores';

	export let jurisdiction: Jurisdiction & {
		plates: FullPlate[];
	};
	export let categories: Category[];

	const platesInfo = jurisdiction.plates.map((plate) => {
		const { userScoreStores, editorialScoreStores, allScoreStores } = storeScores(
			plate.model.scores,
			plate.modelId,
			$session.user?.id,
			categories
		);

		return { plate, userScoreStores, editorialScoreStores, allScoreStores };
	});
</script>

<svelte:head>
	<title>{jurisdiction.name}</title>
</svelte:head>

<div class="top">
	<CardsGrid>
		{#each platesInfo as info}
			<PlateCard plate={info.plate} small={true}>
				<ScoreSheet
					{categories}
					userScores={info.userScoreStores}
					editorialScores={info.editorialScoreStores}
					graphScores={info.allScoreStores}
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
