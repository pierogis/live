<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	let { data } = $props();
</script>

<CardsGrid>
	{#each data.plates as plate (plate)}
		<PlateCard {plate} showYears={false} small={true} />
	{/each}
</CardsGrid>
