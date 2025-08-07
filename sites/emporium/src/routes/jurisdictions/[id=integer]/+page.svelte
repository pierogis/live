<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard, ScoreSheet } from '$lib/components';

	export let data;
	$: ({ categories, platesInfo } = data);
</script>

<div class="top">
	<CardsGrid>
		{#each platesInfo as info (info)}
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
