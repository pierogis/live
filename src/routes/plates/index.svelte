<!-- /plates/index -->
<script lang="ts" context="module">
	/** @type {import('./plates/index').Load} */
	export async function load({ fetch }) {
		const platesResponse = await fetch('/api/plates');
		const categoriesResponse = await fetch('/api/plates/categories');

		const plates: FullPlate[] = await platesResponse.json();
		const categories: Category[] = await categoriesResponse.json();

		return {
			status: 200,
			props: { plates, categories }
		};
	}
</script>

<script lang="ts">
	import { session } from '$app/stores';

	import type { Category } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';

	import { handleChangeScore } from '$lib/api/scores';

	export let categories: Category[];
	export let plates: FullPlate[];
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} small={true}>
			<ScoreSheet
				{categories}
				scores={plate.model.scores}
				handleChangeScore={(value, categoryId) => {
					handleChangeScore({
						value,
						categoryId,
						userId: $session.user?.id,
						modelId: plate.modelId
					});
				}}
			/>
		</PlateCard>
	{/each}
</CardsGrid>
