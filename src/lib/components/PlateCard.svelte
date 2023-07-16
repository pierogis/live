<script lang="ts">
	import type { FullPlate } from '$db/schema';

	import { Card, Interactable, ImageDisplay } from '@pierogis/utensils';

	export let plate: FullPlate;

	export let isAdmin = false;
	export let showYears = true;

	export let small: boolean;

	const alt = `${plate.startYear || '?'}-${plate.endYear || '?'} ${
		plate.jurisdiction.abbreviation
	} license plate`;
</script>

<Interactable clickable={false}>
	<Card shadow={false}>
		{#if isAdmin}
			<a class="edit no-select" href={`/plates/${plate.modelId}/edit`}>✎</a>
		{/if}

		<Interactable>
			<a class="link-box border inset" href={'/jurisdictions/' + plate.jurisdiction.id}>
				{plate.jurisdiction.abbreviation}
			</a>
		</Interactable>

		<a
			class="image-link"
			href={!showYears ? `/jurisdictions/${plate.jurisdiction.id}` : `/plates/${plate.modelId}`}
		>
			<Interactable>
				<ImageDisplay
					{alt}
					shadow={false}
					urls={plate.model.images.map((image) => image.url)}
					width={small ? '200px' : '400px'}
					height={small ? '100px' : '200px'}
				/>
			</Interactable>
		</a>

		{#if showYears}
			<a class="plate-link" href={'/plates/' + plate.modelId}>
				{`${plate.startYear || '?'}-${plate.endYear || '?'}`}
			</a>
		{/if}

		<slot />
	</Card>
</Interactable>

<style>
	.edit {
		position: absolute;
		display: flex;

		background-color: transparent;

		top: 10px;
		left: 10px;
	}

	.plate-link {
		color: var(--text-color);
	}
	.plate-link:hover {
		text-decoration: underline;
	}

	.image-link {
		display: flex;
		justify-content: center;
	}
</style>
