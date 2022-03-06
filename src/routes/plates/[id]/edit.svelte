<script lang="ts">
	import type { Jurisdiction, Plate } from '$lib/database/models';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let plate: Plate;
	export let jurisdictions: Jurisdiction[];
</script>

<form action="/{plate.id}?_method=PUT" method="post">
	<PlateTemplate {jurisdictions} {plate} />
</form>
