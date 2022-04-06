<script lang="ts" context="module">
	import { protect } from '$lib/helpers';
	/** @type {import('./plates/[id]/edit').Load} */
	export async function load(event) {
		return protect(event);
	}
</script>

<script lang="ts">
	import type { Jurisdiction } from '@prisma/client';
	import type { FullPlate } from '$lib/database/models';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let plate: FullPlate;
	export let jurisdictions: Jurisdiction[];
</script>

<svelte:head>
	<title>plate: {plate.id} edit</title>
</svelte:head>

<form action="/plates/{plate.id}?_method=PUT" method="post" netlify>
	<PlateTemplate {jurisdictions} {plate} />
</form>
