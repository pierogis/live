<script lang="ts">
	import { PlateTemplate } from '$lib/components';

	export let data;
	$: ({ jurisdictions } = data);

	export let form;
</script>

<form method="post">
	<PlateTemplate {jurisdictions} />
</form>

{#if form?.message}
	<div class="border inset no-select bad alert">
		{form?.message}
	</div>
{/if}
