<script lang="ts">
	import { session } from '$app/stores';
	import type { Plate } from '$lib/database/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import CardsGrid from '$lib/components/CardsGrid.svelte';

	export let plates: Plate[];

	let showAdmin = $session.user.id == 0;
</script>

<CardsGrid>
	{#each plates as plate}
		<PlateCard {plate} {showAdmin} />
	{/each}
</CardsGrid>
