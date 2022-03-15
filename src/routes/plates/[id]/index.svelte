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
	import type { Plate } from '@prisma/client';

	export let plate: Plate;
	export let isAdmin: boolean;
</script>

<svelte:head>
	<title>{'plate: ' + plate.id}</title>
</svelte:head>

<div class="top">
	<div class="card">
		<PlateCard {plate} {isAdmin} small={false} />
	</div>

	<div class="description">
		This is a description of the license plate of which we are speaking. This is a description of
		the license plate of which we are speaking. This is a description of the license plate of which
		we are speaking.
	</div>
</div>

<div id="reviews" class="divider horizontal" />

<!-- <Reviews /> -->
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

	.card {
		flex: 1 240px;
	}

	.description {
		flex: 3;
		font-family: 'Lora';
		font-weight: normal;
		font-size: 0.8rem;
		padding: 1rem;
	}

	.divider.horizontal {
		height: 8px;
		width: 90vw;
	}

	@media only screen and (max-width: 40rem) {
		.top {
			flex-direction: column;
		}
	}
</style>
