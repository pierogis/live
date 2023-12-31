<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let data;

	export let form;
</script>

<svelte:head>
	<title>{data.plate.jurisdiction.abbreviation} plate: ({data.plate.modelId}) edit</title>
</svelte:head>

<form action="/plates/{data.plate.modelId}/edit?/update" method="post">
	<PlateTemplate jurisdictions={data.jurisdictions} plate={data.plate} />
</form>

{#if form?.body.message}
	<div class="border inset no-select bad alert">
		{form?.body.message}
	</div>
{/if}
