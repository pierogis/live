<script lang="ts" context="module">
	import { PUBLIC_API_BASE } from '$env/static/public';
	import { protect } from '$lib/helpers';

	import type { Load } from './__types/create';
	export const load: Load = async ({ session, fetch }) => {
		async function handle() {
			const response = await fetch(`${PUBLIC_API_BASE}/jurisdictions`);

			const jurisdictions: Jurisdiction[] = await response.json();

			return {
				props: { jurisdictions }
			};
		}

		return protect(session, handle);
	};
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
