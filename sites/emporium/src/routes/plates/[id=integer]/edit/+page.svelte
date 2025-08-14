<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	let { data, form } = $props();
</script>

<form action="/plates/{data.plate.modelId}/edit?/update" method="post">
	<PlateTemplate jurisdictions={data.jurisdictions} plate={data.plate} />
</form>

{#if form?.message}
	<div class="border inset no-select bad alert">
		{form.message}
	</div>
{/if}
