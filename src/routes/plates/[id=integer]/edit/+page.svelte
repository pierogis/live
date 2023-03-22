<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	$: ({ plate, jurisdictions } = data);

	export let form: ActionData;
</script>

<svelte:head>
	<title>{plate.jurisdiction.abbreviation} plate: ({plate.modelId}) edit</title>
</svelte:head>

<form action="/plates/{plate.modelId}/edit?/update" method="post">
	<PlateTemplate {jurisdictions} {plate} />
</form>

{#if form?.body.message}
	<div class="border inset shadow no-select bad alert">
		{form?.body.message}
	</div>
{/if}
