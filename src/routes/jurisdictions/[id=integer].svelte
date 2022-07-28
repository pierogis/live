<!-- jurisdictions/[id=integer].svelte -->
<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';

	import type { Load } from './__types/[id=integer]';
	export const load: Load = async ({ params, fetch }) => {
		const jurisdictionResponse = await fetch(`${PUBLIC_API_BASE}/jurisdictions/${params.id}`);
		const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

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
	};
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
		const { userScores, editorialScores, allScores } = storeScores(
			plate.model.scores,
			plate.modelId,
			$session.user?.id,
			categories
		);

		return { plate, userScores, editorialScores, allScores };
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
					userScores={info.userScores}
					editorialScores={info.editorialScores}
					graphScores={info.allScores}
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
