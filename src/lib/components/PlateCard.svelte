<script lang="ts">
	import { goto } from '$app/navigation';
	import type { FullPlate } from '$lib/database/models';

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

	<a class="link" href={'/jurisdictions/' + plate.jurisdiction.id}
		>{plate.jurisdiction.abbreviation}</a
	>

	<a href={!showYears ? `/jurisdictions/${plate.jurisdiction.id}` : `/plates/${plate.modelId}`}>
		<ImageDisplay {alt} {small} urls={plate.model.images.map((image) => image.url)} />
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

	.link {
		color: var(--text-color);
	}
</style>
