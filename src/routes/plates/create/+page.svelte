<script lang="ts">
	import { PlateTemplate } from '$lib/components';

	export let data;

	export let form;
</script>

<svelte:head>
	<title>create plate</title>
</svelte:head>

<form method="post">
	<PlateTemplate jurisdictions={data.jurisdictions} />
</form>

{#if form?.message}
	<div class="border inset shadow no-select bad alert">
		{form?.message}
	</div>
{/if}
