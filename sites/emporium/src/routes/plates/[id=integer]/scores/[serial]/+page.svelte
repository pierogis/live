<script lang="ts">
	import { enhance } from '$app/forms';

	import { valueInputName, categoryIdInputName } from './_form';

	import { Card, Interactable } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	export let data;

	$: ({ categories, scores, plate, isUser } = data);

	$: scoreSet = scores.reduce<{ [categoryId: number]: number }>((previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	}, {});

	const scoreFormId = 'scoreForm';
</script>

<PlateCard {plate} small={true} />

<div class="grid">
	{#each categories as category (category.id)}
		<Card>
			<span><u>{category.name}</u> {category.symbol}</span>
			{#if isUser}
				<form hidden method="post" id={scoreFormId} use:enhance />

				<input hidden form={scoreFormId} name={categoryIdInputName} value={category.id} />

				<input
					class="border inset"
					type="number"
					min="0"
					max="10"
					required
					form={scoreFormId}
					name={valueInputName}
					value={scoreSet[category.id] || ''}
				/>

				<div class="button-group">
					<Interactable>
						<button
							class="border inset good"
							type="submit"
							form={scoreFormId}
							formaction="?/update"
						>
							submit
						</button>
					</Interactable>

					<Interactable>
						<button class="border inset bad" type="submit" form={scoreFormId} formaction="?/delete">
							clear
						</button>
					</Interactable>
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

	.button-group {
		display: flex;
		gap: 10px;
	}
</style>
