<!-- /plates/index -->
<script lang="ts" context="module">
	/** @type {import('./plates/index').Load} */
	export async function load({ fetch, session }) {
		const platesResponse = await fetch('/api/plates');
		const categoriesResponse = await fetch('/api/plates/categories');

		const plates: FullPlate[] = await platesResponse.json();
		const categories: Category[] = await categoriesResponse.json();

		return {
			status: 200,
			props: { plates, categories, user: session.user }
		};
	}
</script>

<script lang="ts">
	import type { Category, User } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';
	import ScoreSheet from '$lib/components/ScoreSheet.svelte';
	import { transformScores } from '$lib/api/scores';

	export let categories: Category[];
	export let plates: FullPlate[];

	export let user: User;

	const plateInfo = plates.map((plate) => {
		const { userScores, editorialScores, graphScores } = transformScores(
			plate.model.scores,
			plate.modelId,
			user?.id,
			categories
		);

		return { plate, userScores, editorialScores, graphScores };
	});
</script>

<svelte:head>
	<title>plates</title>
</svelte:head>

<CardsGrid>
	{#each plateInfo as info}
		<PlateCard plate={info.plate} small={true}>
			<ScoreSheet
				{categories}
				userScores={info.userScores}
				editorialScores={info.editorialScores}
				graphScores={info.graphScores}
			/>
		</PlateCard>
	{/each}
</CardsGrid>
