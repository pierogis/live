<script lang="ts" context="module">
	import { protect } from '$lib/helpers';

	/** @type {import('./plates/[id]/index').Load} */
	export async function load(event) {
		return protect(event);
	}
</script>

<script lang="ts">
	import type { Jurisdiction } from '@prisma/client';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let jurisdictions: Jurisdiction[];
</script>

<form action="/plates" method="post" netlify>
	<PlateTemplate {jurisdictions} />
</form>
