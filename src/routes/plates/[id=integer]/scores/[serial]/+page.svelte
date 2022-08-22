<script lang="ts">
	import { valueEntryName } from './_form';

	import { Card } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ categories, plate, scores, serial, isUser } = data);

	$: scoreSet = scores.reduce<{ [categoryId: number]: number }>((previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	}, {});

	const submitScoreFormId = 'submitScore';
	const deleteScoreFormId = 'deleteScore';
</script>

<svelte:head>
	<title>user: {serial.toUpperCase()} plate ${plate.modelId} scores</title>
</svelte:head>

<PlateCard {plate} small={true} />

<div class="grid">
	{#each categories as category}
		<Card>
			<div><u>{category.name}</u> <span>{category.symbol}</span></div>
			{#if isUser}
				<form hidden action="{serial}/{category.id}" method="post" id={submitScoreFormId} />
				<form hidden action="{serial}/{category.id}/delete" method="post" id={deleteScoreFormId} />

				<input
					class="border inset shadow"
					type="number"
					min="0"
					max="10"
					required
					form={submitScoreFormId}
					name={valueEntryName}
					value={scoreSet[category.id] || ''}
				/>

				<div>
					<button class="border inset shadow good" type="submit" form={submitScoreFormId}>
						submit
					</button>
					<button type="submit" form={deleteScoreFormId}>❌</button>
				</div>
			{:else}
				{scoreSet[category.id]}
			{/if}
		</Card>
	{/each}
</div>

<style>
	.grid {
		padding: 2rem;
		display: flex;

		justify-content: center;
		gap: 2rem;

		flex-wrap: wrap;
	}
</style>
