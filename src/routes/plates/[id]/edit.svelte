<script lang="ts" context="module">
	import { protect } from '$lib/helpers';
	/** @type {import('./plates/[id]/index').Load} */
	export async function load(event) {
		return protect(event);
	}
</script>

<script lang="ts">
	import type { Jurisdiction, Plate, Image } from '$lib/database/models';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let plate: Plate;
	export let jurisdictions: Jurisdiction[];
	export let images: Image[];
</script>

<form action="/plates/{plate.id}?_method=PUT" method="post">
	<PlateTemplate {jurisdictions} {plate} {images} />
</form>
