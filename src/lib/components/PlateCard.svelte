<script lang="ts">
	import { goto } from '$app/navigation';
	import type { FullPlate } from '$lib/database/models';

	import Card from '@pierogis/utensils/Card.svelte';

	export let plate: FullPlate;

	export let isAdmin = false;
	export let showYears = true;

	export let small: boolean;
</script>

<Card>
	{#if isAdmin}
		<a
			class="edit no-select"
			href={`/plates/${plate.modelId}/edit`}
			on:click|preventDefault={() => goto(`/plates/${plate.modelId}/edit`)}>✎</a
		>
	{/if}

	<a class="link" href={'/jurisdictions/' + plate.jurisdiction.id}
		>{plate.jurisdiction.abbreviation}</a
	>

	<a href={!showYears ? `/jurisdictions/${plate.jurisdiction.id}` : `/plates/${plate.modelId}`}>
		<div class="image-container">
			{#if plate.model.images}
				<img
					class="image inset shadow"
					class:small
					src={plate.model.images[0]?.url || ''}
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
		<a class="link" href={'/plates/' + plate.modelId}
			>{`${plate.startYear || '?'}-${plate.endYear || '?'}`}</a
		>
	{/if}

	<slot />
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
