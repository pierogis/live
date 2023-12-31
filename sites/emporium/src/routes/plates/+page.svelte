<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard, ScoreSheet } from '$lib/components';

	export let data;
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each data.platesInfo as info}
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
