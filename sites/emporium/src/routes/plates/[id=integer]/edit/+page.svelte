<script lang="ts">
	import PlateTemplate from '$lib/components/PlateTemplate.svelte';

	export let data;
	$: ({ plate, jurisdictions } = data);

	export let form;
</script>

<form action="/plates/{plate.modelId}/edit?/update" method="post">
	<PlateTemplate {jurisdictions} {plate} />
</form>

{#if form?.message}
	<div class="border inset no-select bad alert">
		{form.message}
	</div>
{/if}
