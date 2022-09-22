<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ categories, platesInfo } = data);
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
