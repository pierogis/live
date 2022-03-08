<script lang="ts">
	import { onMount } from 'svelte';

	import type { Plate, Score, Image } from '$lib/database/models';

	import Card from './Card.svelte';
	import Scores from './Scores.svelte';
	import { session } from '$app/stores';

	export let plate: Plate;

	export let isAdmin = $session.user ? $session.user.isAdmin : false;
	export let showJurisdiction = true;
	export let showYears = true;
	export let showScores = true;

	let scores: Score[] = [];
	let images: Image[] = [];

	async function getScores(): Promise<void> {
		const response = await fetch(`/plates/${plate.id}/scores`);
		const data = await response.json();
		scores = data.scores;
	}

	async function getImages(): Promise<void> {
		const response = await fetch(`/plates/${plate.id}/images`);
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
		<form class="admin left" action="/plates/{plate.id}/edit">
			<input type="submit" value="✎" />
		</form>
		<form class="admin right" action="/plates/{plate.id}?_method=DELETE" method="post">
			<input type="submit" value="❌" />
		</form>
	{/if}
	{#if showJurisdiction}
		<a class="link" href={'/jurisdictions/' + plate.jurisdiction}>{plate.jurisdiction}</a>
	{/if}

	<a
		class="image-link"
		href={'/' + (!showYears ? 'jurisdictions/' + plate.jurisdiction : 'plates/' + plate.id)}
	>
		<img
			class="image inset shadow"
			src="https://www.flhsmv.gov/wp-content/uploads/plate1-1.jpg"
			alt={`${plate.startYear || ''}-${plate.endYear || ''} ${plate.jurisdiction} license plate`}
		/>
	</a>

	{#if showYears}
		<a class="link" href={'/plates/' + plate.id}
			>{`${plate.startYear || '?'}-${plate.endYear || '?'}`}</a
		>
	{/if}

	{#if showScores}<Scores {scores} />{/if}
</Card>

<style>
	.admin {
		position: absolute;
		display: flex;
	}
	.admin.left {
		left: 0.4rem;
	}
	.admin.right {
		right: 0.4rem;
	}
	.image {
		width: 90%;
		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;
	}

	.image-link {
		display: flex;
		justify-content: center;
	}

	.link {
		color: var(--text-color);
	}
</style>
