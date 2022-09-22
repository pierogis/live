<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	import type { PageData, ActionData } from './$types';
	export let data: PageData;
	$: ({ jurisdictions } = data);

	export let form: ActionData;
</script>

<svelte:head>
	<title>create plate</title>
</svelte:head>

<form method="post">
	<PlateTemplate {jurisdictions} />
</form>

{#if form?.message}
	<div class="border inset shadow no-select bad alert">
		{form?.message}
	</div>
{/if}
