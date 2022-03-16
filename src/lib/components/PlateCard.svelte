<script lang="ts">
	import type { FullPlate } from '$lib/database/models';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';

	export let plate: FullPlate;

	export let isAdmin = false;
	export let showYears = true;

	export let small: boolean;
</script>

<Card>
	{#if isAdmin}
		<form class="admin-controls left" action="/plates/{plate.id}/edit">
			<input type="submit" value="✎" />
		</form>
		<form class="admin-controls right" action="/plates/{plate.id}?_method=DELETE" method="post">
			<input type="submit" value="❌" />
		</form>
	{/if}

	<a class="link" href={'/jurisdictions/' + plate.jurisdiction.id}
		>{plate.jurisdiction.abbreviation}</a
	>

	<a href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction.id : 'plates/' + plate.id)}>
		<div class="image-container">
			{#if plate.images}
				<img
					class="image inset shadow"
					class:small
					src={`${plate.images[0].url}/${small ? 'small' : 'medium'}`}
					alt={`${plate.startYear || ''}-${plate.endYear || ''} ${
						plate.jurisdiction
					} license plate`}
				/>
			{:else}
				<img
					class="image inset shadow"
					class:small
					src={'/karl.svg'}
					alt={`${plate.startYear || ''}-${plate.endYear || ''} ${
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
	{#if plate.scores}
		<Scores scores={plate.scores} />
	{/if}
</Card>

<style>
	.admin-controls {
		position: absolute;
		display: flex;
	}
	.admin-controls.left {
		left: 0.4rem;
	}
	.admin-controls.right {
		right: 0.4rem;
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
