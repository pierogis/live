<script lang="ts">
	import { enhance } from '$app/forms';

	import { valueInputName, categoryIdInputName } from './_form';

	import { Card } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	export let data;
	$: ({ categories, plate, scores, serial, isUser } = data);

	$: scoreSet = scores.reduce<{ [categoryId: number]: number }>((previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	}, {});

	const scoreFormId = 'scoreForm';
</script>

<svelte:head>
	<title>
		user: {serial.toUpperCase()}
		{plate.jurisdiction.abbreviation} plate ({plate.modelId}) scores
	</title>
</svelte:head>

<PlateCard {plate} small={true} />

<div class="grid">
	{#each categories as category}
		<Card>
			<span><u>{category.name}</u> {category.symbol}</span>
			{#if isUser}
				<form hidden method="post" id={scoreFormId} use:enhance />

				<input hidden form={scoreFormId} name={categoryIdInputName} value={category.id} />

				<input
					class="border inset shadow"
					type="number"
					min="0"
					max="10"
					required
					form={scoreFormId}
					name={valueInputName}
					value={scoreSet[category.id] || ''}
				/>

				<div>
					<button
						class="border inset shadow good"
						type="submit"
						form={scoreFormId}
						formaction={'?/update'}
					>
						submit
					</button>
					<button type="submit" form={scoreFormId} formaction={'?/delete'}>❌</button>
				</div>
			{:else}
				<b>{scoreSet[category.id] || '_'}</b>
			{/if}
		</Card>
	{/each}
</div>

<style>
	span {
		width: 10rem;
		text-align: center;
	}
	.grid {
		padding: 2rem;
		display: flex;

		justify-content: center;
		gap: 2rem;

		flex-wrap: wrap;
	}
</style>
