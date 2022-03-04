<script lang="ts">
	import type { Jurisdiction } from '$lib/database/jurisdiction';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let jurisdictions: Jurisdiction[];
</script>

<PlateTemplate {jurisdictions} />
