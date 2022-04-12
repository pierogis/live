<script lang="ts" context="module">
	import { protect } from '$lib/helpers';

	/** @type {import('./plates/create').Load} */
	export async function load({ session, fetch }) {
		async function handle() {
			const response = await fetch('/api/jurisdictions');

			const jurisdictions: Jurisdiction[] = await response.json();

			return {
				props: { jurisdictions }
			};
		}

		return protect(session, handle);
	}
</script>

<script lang="ts">
	import type { Jurisdiction } from '@prisma/client';

	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let jurisdictions: Jurisdiction[];
</script>

<svelte:head>
	<title>create plate</title>
</svelte:head>

<form method="post">
	<PlateTemplate {jurisdictions} />
</form>
