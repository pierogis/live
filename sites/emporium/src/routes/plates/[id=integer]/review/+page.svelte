<script lang="ts">
	import { Section } from '@pierogis/utensils';
	import { ReviewForm, PlateCard } from '$lib/components';

	let { data } = $props();
</script>

<PlateCard plate={data.plate} showYears small={false} />

<br />

<Section column>
	{#snippet title()}
		<h3>review</h3>
	{/snippet}
	<ReviewForm plate={data.plate} data={data.form} />
</Section>
