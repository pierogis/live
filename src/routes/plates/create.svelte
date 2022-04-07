<script lang="ts" context="module">
	import { protect } from '$lib/helpers';

	/** @type {import('./plates/create').Load} */
	export async function load({ session, fetch }) {
		async function handle() {
			const jurisdictions = await fetch('/api/jurisdictions');

			return {
				body: { jurisdictions }
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
