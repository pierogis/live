<script lang="ts">
	import { writable } from 'svelte/store';

	import { Section } from '@pierogis/utensils';
	import { ReviewForm, PlateCard } from '$lib/components';

	export let data;
</script>

<PlateCard plate={data.plate} showYears small={false} />

<br />

<Section title="review" column>
	<ReviewForm plate={data.plate} data={data.form} />
</Section>
