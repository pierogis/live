<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
	$: ({ plate, jurisdictions } = data);
</script>

<svelte:head>
	<title>plate: {plate.modelId} edit</title>
</svelte:head>

<form action="/plates/{plate.modelId}/edit" method="post">
	<PlateTemplate {jurisdictions} {plate} />
</form>
