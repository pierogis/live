<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	export let data;
	$: ({ plates } = data);
</script>

<CardsGrid>
	{#each plates as plate (plate)}
		<PlateCard {plate} showYears={false} small={true} />
	{/each}
</CardsGrid>
