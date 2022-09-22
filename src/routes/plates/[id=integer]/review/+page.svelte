<script lang="ts">
	import { writable } from 'svelte/store';

	import ReviewForm from '$lib/components/ReviewForm.svelte';

	import type { PageData } from './$types';
	import { Section } from '@pierogis/utensils';
	import PlateCard from '$lib/components/PlateCard.svelte';
	export let data: PageData;

	$: ({ plate, review } = data);
</script>

<PlateCard {plate} showYears small={false} />

<br />

<Section title="review" column>
	<ReviewForm {plate} review={writable(review)} />
</Section>
