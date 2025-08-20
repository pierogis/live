<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { storeScores } from '$lib/api/scores';

	import { PlateCard, ScoreSheet } from '$lib/components';

	let { data } = $props();

	let platesInfo = data.plates.then((plates) =>
		plates.map((plate) => {
			const { userScores, editorialScores, allScores } = storeScores(
				plate.model.scores,
				plate.modelId,
				data.sessionUser?.id,
				data.categories,
				fetch
			);

			return { plate, userScores, editorialScores, allScores };
		})
	);
</script>

{#await platesInfo}
	<div>...loading</div>
{:then platesInfo}
	<CardsGrid>
		{#each platesInfo as info (info)}
			<PlateCard plate={info.plate} small={true}>
				<ScoreSheet
					categories={data.categories}
					userScores={info.userScores}
					editorialScores={info.editorialScores}
					graphScores={info.allScores}
				/>
			</PlateCard>
		{/each}
	</CardsGrid>
{/await}
