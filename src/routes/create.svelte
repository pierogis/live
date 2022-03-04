<script lang="ts">
	import type { Jurisdiction } from '$lib/database/models';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let jurisdictions: Jurisdiction[];
</script>

<PlateTemplate {jurisdictions} />
