<script lang="ts">
	import { PlateTemplate } from '$lib/components';

	export let data;
	$: ({ jurisdictions } = data);

	export let form;
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
