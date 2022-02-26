<script lang="ts">
	import type { Plate } from '$lib/database/plate';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import PlatesGrid from '$lib/components/PlatesGrid.svelte';

	export let plates: Plate[];
</script>

<PlatesGrid grid={true}>
	{#each plates as plate}
		<PlateCard {plate} />
	{/each}
</PlatesGrid>
