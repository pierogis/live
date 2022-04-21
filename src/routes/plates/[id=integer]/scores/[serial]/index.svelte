<!-- plates/[id=integer]/scores/[serial]/index.svelte -->
<script lang="ts" context="module">
	/** @type {import('./plates/[id=integer]/scores/[serial]/index').Load} */
	export async function load({ session, params, fetch }) {
		const userResponse = await fetch(`/api/users?serial=${params.serial}`);
		const user: User = await userResponse.json();

		const scoresResponse = await fetch(`/api/plates/${params.id}/scores/${user.id}`);

		const scores: Score[] = await scoresResponse.json();

		const isUser = session.user.serial == params.serial;

		return {
			props: { scores, serial: params.serial, isUser }
		};
	}
</script>

<script lang="ts">
	import Card from '$lib/components/Card.svelte';
	import { valueEntryName } from './_form';
	import type { Category, Score, User } from '@prisma/client';

	export let categories: Category[];
	export let scores: Score[];

	export let scoreSet: { [categoryId: number]: number } = scores.reduce((previous, score) => {
		previous[score.categoryId] = score.value;
		return previous;
	}, {});

	export let serial: string;

	export let isUser: boolean;

	const submitScoreFormId = 'submitScore';
	const deleteScoreFormId = 'deleteScore';
</script>

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
		display: flex;

		justify-content: center;
		gap: 1rem;

		flex-wrap: wrap;
	}
</style>
