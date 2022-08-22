<script lang="ts">
	import { page } from '$app/stores';

	import { storeScores } from '$lib/api/scores';

	import { CardsGrid } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ categories, plates, user } = data);

	$: platesInfo = plates.map((plate) => {
		const { userScores, editorialScores, allScores } = storeScores(
			plate.model.scores,
			plate.modelId,
			user?.id,
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
