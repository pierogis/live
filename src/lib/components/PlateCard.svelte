<script lang="ts">
	import { goto } from '$app/navigation';
	import type { FullPlate } from '$lib/models';

	import { Card, ImageDisplay } from '@pierogis/utensils';

	export let plate: FullPlate;

	export let isAdmin = false;
	export let showYears = true;

	export let small: boolean;

	const alt = `${plate.startYear || '?'}-${plate.endYear || '?'} ${
		plate.jurisdiction.abbreviation
	} license plate`;
</script>

<Card>
	{#if isAdmin}
		<a
			class="edit no-select"
			href={`/plates/${plate.modelId}/edit`}
			on:click|preventDefault={() => goto(`/plates/${plate.modelId}/edit`)}>✎</a
		>
	{/if}

	<a class="jurisdiction-link" href={'/jurisdictions/' + plate.jurisdiction.id}
		>{plate.jurisdiction.abbreviation}</a
	>

	<a
		class="image-link"
		href={!showYears ? `/jurisdictions/${plate.jurisdiction.id}` : `/plates/${plate.modelId}`}
	>
		<ImageDisplay
			{alt}
			urls={plate.model.images.map((image) => image.url)}
			width={small ? '200px' : '400px'}
			height={small ? '100px' : '200px'}
		/>
	</a>

	{#if showYears}
		<a class="plate-link" href={'/plates/' + plate.modelId}
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

		top: 0;
		left: 0.4rem;
	}

	.jurisdiction-link {
		text-decoration: underline;
	}

	.jurisdiction-link,
	.plate-link {
		color: var(--text-color);
	}

	.image-link {
		display: flex;
		justify-content: center;
	}
</style>
