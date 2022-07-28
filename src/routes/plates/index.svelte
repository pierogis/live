<!-- /plates/index -->
<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';

	import type { Load } from './__types';
	export const load: Load = async ({ fetch }) => {
		const platesResponse = await fetch(`${PUBLIC_API_BASE}/plates`);
		const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);

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
	<title>plates</title>
</svelte:head>

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
