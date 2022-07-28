<!-- plates/[id=integer]/scores/[serial]/index.svelte -->
<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';

	import type { Load } from './__types';
	export const load: Load = async ({ session, params, fetch }) => {
		const userResponse = await fetch(`${PUBLIC_API_BASE}/users?serial=${params.serial}`);
		const user: User = await userResponse.json();

		const plateResponse = await fetch(`${PUBLIC_API_BASE}/plates/${params.id}`);
		const plate: FullPlate = await plateResponse.json();

		const scores = plate.model.scores.filter((score) => score.userId == user.id);

		const categoriesResponse = await fetch(`${PUBLIC_API_BASE}/plates/categories`);
		const categories: Category[] = await categoriesResponse.json();

		const isUser = session.user?.serial == params.serial;

		return {
			props: { plate, scores, serial: params.serial, isUser, categories }
		};
	};
</script>

<script lang="ts">
	import type { Category, Score, User } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import { valueEntryName } from './_form';

	import { Card } from '@pierogis/utensils';

	import PlateCard from '$lib/components/PlateCard.svelte';

	export let categories: Category[];
	export let plate: FullPlate;
	export let scores: Score[];

	export let scoreSet = scores.reduce<{ [categoryId: number]: number }>((previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	}, {});

	export let serial: string;

	export let isUser: boolean;

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
