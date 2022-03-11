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
	import type { Plate } from '$lib/database/models';

	export let plate: Plate;
	export let isAdmin: boolean;
</script>

<svelte:head>
	<title>{'plate: ' + plate.id}</title>
</svelte:head>

<PlateCard {plate} {isAdmin} />

<div class="description">This is a description of the license plate of which we are speaking.</div>

<style>
	.description {
		font-family: 'Lora';
		font-weight: normal;
		font-size: 0.8rem;
	}
</style>
