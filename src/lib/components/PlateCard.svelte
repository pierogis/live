<script lang="ts">
	import { onMount } from 'svelte';

	import type { Plate, Score, Image } from '$lib/database/models';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';
	import { session } from '$app/stores';
	import { variables } from '$lib/env';

	export let plate: Plate;

	export let isAdmin = $session.user ? $session.user.id == variables.adminId : false;
	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;

	let scores: Score[] = [];
	let images: Image[] = [];

	async function getScores(): Promise<void> {
		const response = await fetch(`/${plate.id}/scores`);
		const data = await response.json();
		scores = data.scores;
	}

	async function getImages(): Promise<void> {
		const response = await fetch(`/${plate.id}/images`);
		const data = await response.json();
		images = data.images;
	}

	onMount(async () => {
		await getScores();
		await getImages();
	});
</script>

<Card>
	{#if isAdmin}
		<form class="admin left" action="/{plate.id}/edit">
			<input type="submit" value="✎" />
		</form>
		<form class="admin right" action="/{plate.id}?_method=DELETE" method="post">
			<input type="submit" value="❌" />
		</form>
	{/if}
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction}>{plate.jurisdiction}</a>
	{/if}

	<a
		class="image-link"
		href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : plate.id)}
	>
		<img
			class="image"
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.jurisdiction} license plate for ${plate.startYear}-${plate.endYear}`}
		/>
	</a>

	{#if showYears}
		<a class="link" href={'/' + plate.id}>{`${plate.startYear || '?'}-${plate.endYear || '?'}`}</a>
	{/if}

	{#if showScores}<Scores {scores} />{/if}
</Card>

<style>
	.admin {
		position: absolute;
		display: flex;
	}
	.admin.left {
		left: 8px;
	}
	.admin.right {
		right: 8px;
	}
	.image {
		border-top: solid 4px rgba(100, 100, 100, 0.8);
		border-left: solid 4px rgba(100, 100, 100, 0.8);
		border-bottom: solid 4px rgba(150, 150, 150, 0.8);
		border-right: solid 4px rgba(150, 150, 150, 0.8);
		border-radius: 8%;
	}

	.image-link {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
