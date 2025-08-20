<script lang="ts">
	import { CardsGrid } from '@pierogis/utensils';

	import { PlateCard } from '$lib/components';

	let { data } = $props();
</script>

{#await data.plates}
	<div>...loading</div>
{:then plates}
	<CardsGrid>
		{#each plates as plate (plate)}
			<PlateCard {plate} showYears={false} small={true} />
		{/each}
	</CardsGrid>
{/await}
