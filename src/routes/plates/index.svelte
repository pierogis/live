<!-- /plates/index -->
<script lang="ts" context="module">
	import type { Load } from './__types';
	export const load: Load = async ({ fetch }) => {
		const platesResponse = await fetch('/api/plates');
		const categoriesResponse = await fetch('/api/plates/categories');

		const plates: FullPlate[] = await platesResponse.json();
		const categories: Category[] = await categoriesResponse.json();

		return {
			status: 200,
			props: { plates, categories }
		};
	};
</script>

<script lang="ts">
	import { session } from '$app/stores';

	import type { Category } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import { storeScores } from '$lib/api/scores';

	import { CardsGrid } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	export let categories: Category[];
	export let plates: FullPlate[];

	const platesInfo = plates.map((plate) => {
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
	<title>plates</title>
</svelte:head>

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
