<script lang="ts" context="module">
	/** @type {import('./plates/[id]/index').Load} */
	export async function load({ props, session }) {
		const isAdmin = session.user && session.user.isAdmin;

		if (!props.plate) {
			return { status: 404, error: "plate doesn't exist" };
		}

		return {
			props: { plate: props.plate, isAdmin }
		};
	}
</script>

<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import ScoreDisplay from '$lib/components/ScoreDisplay.svelte';
	import { categoriesInfo } from '$lib/categoriesInfo';
	import type { FullPlate } from '$lib/database/models';

	export let plate: FullPlate;
	export let isAdmin: boolean;

	const editorial = plate.reviews.find((review) => review.userId == 1);
	const editorialScores = plate.scores.filter((score) => score.userId == 1);
</script>

<svelte:head>
	<title>{'plate: ' + plate.id}</title>
</svelte:head>

<div class="top">
	<div class="card">
		<PlateCard {plate} {isAdmin} small={false} />
	</div>

	{#if editorial}
		<div class="editorial">
			<div class="review">{editorial.description}</div>
			{#each editorialScores as score}
				<span class="category-emoji">{categoriesInfo[score.category].emoji}</span>
				<span class="category-name">{score.category}</span>
				<div class="category-score">
					<ScoreDisplay editorialScore={score} />
				</div>
			{/each}
		</div>
	{/if}
</div>

<div class="divider horizontal" />

<!-- <Reviews id="reviews"/> -->
<style>
	.top {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;

		padding: 32px;

		justify-content: center;
		align-items: center;
		width: 90%;
	}

	.category-emoji {
		margin: 0.5rem;
		grid-column: 1;
	}

	.category-name {
		grid-column: 2;
	}

	.category-score {
		grid-column: 3;
		padding-bottom: 0.2rem;
	}

	.category-explanation {
		grid-column: 4;
		font-family: 'Lora';
		font-weight: normal;
	}

	.card {
		flex: 1 240px;
	}

	.editorial {
		flex: 3;
		padding: 1rem;

		display: grid;
		align-items: center;
		justify-items: left;
		grid-template-columns: 0.8fr 3fr 2fr 8fr;
		gap: 0.2rem;
	}

	.review {
		width: 90%;
		display: flex;
		align-content: left;
	}

	.divider.horizontal {
		height: 8px;
		width: 90vw;
		margin: 1rem;
	}

	@media only screen and (max-width: 40rem) {
		.top {
			flex-direction: column;
		}
	}
</style>
