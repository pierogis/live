<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard, ScoreSheet } from '$lib/components';

	export let data;
	$: ({ categories, platesInfo } = data);
</script>

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
