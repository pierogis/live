<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	import type { PageData } from './$types';
	export let data: PageData;
	$: ({ jurisdictions } = data);
</script>

<svelte:head>
	<title>create plate</title>
</svelte:head>

<form method="post">
	<PlateTemplate {jurisdictions} />
</form>
