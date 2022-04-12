<script lang="ts">
	import { goto } from '$app/navigation';
	import type { FullPlate } from '$lib/database/models';

	import Card from './Card.svelte';
	import ScoreSheet from './ScoreSheet.svelte';

	export let plate: FullPlate;

	export let isAdmin: boolean = false;
	export let showYears = true;
	export let showScores = true;

	export let small: boolean;

	export let interactive = true;
</script>

<Card>
	{#if isAdmin}
		<a
			class="edit no-select"
			href={`/plates/${plate.id}/edit`}
			on:click|preventDefault={() => goto(`/plates/${plate.id}/edit`)}>✎</a
		>
	{/if}

	<a class="link" href={'/plates/jurisdictions/' + plate.jurisdiction.id}
		>{plate.jurisdiction.abbreviation}</a
	>

	<a href={'/plates/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction.id : plate.id)}>
		<div class="image-container">
			{#if plate.images}
				<img
					class="image inset shadow"
					class:small
					src={plate.images[0]?.url || ''}
					alt={`${plate.startYear || '?'}-${plate.endYear || '?'} ${
						plate.jurisdiction.abbreviation
					} license plate`}
				/>
			{:else}
				<img
					class="image inset shadow"
					class:small
					src={'/karl.svg'}
					alt={`${plate.startYear || '?'}-${plate.endYear || '?'} ${
						plate.jurisdiction.abbreviation
					} license plate`}
				/>
			{/if}
		</div>
	</a>

	{#if showYears}
		<a class="link" href={'/plates/' + plate.id}
			>{`${plate.startYear || '?'}-${plate.endYear || '?'}`}</a
		>
	{/if}
	{#if showScores}
		<ScoreSheet
			scores={plate.scores}
			scoreUrl={interactive ? `/api/plates/${plate.id}/scores/` : null}
		/>
	{/if}
</Card>

<style>
	.edit {
		position: absolute;
		display: flex;

		background-color: transparent;

		left: 0.4rem;
	}

	.image {
		object-fit: contain;

		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;

		width: 100%;

		max-width: 400px;
		max-height: 200px;
	}

	.image.small {
		max-width: 200px;
		max-height: 100px;
	}

	.image-container {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
