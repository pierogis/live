<script lang="ts">
	import { PlateTemplate } from '$lib/components';

	let { data, form } = $props();
</script>

<form method="post">
	<PlateTemplate jurisdictions={data.jurisdictions} />
</form>

{#if form?.message}
	<div class="border inset no-select bad alert">
		{form?.message}
	</div>
{/if}
