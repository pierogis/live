<script lang="ts">
	import type { Plate } from '$lib/models';

	import PlateCard from '$lib/components/PlateCard.svelte';
	import Plates from '$lib/components/Plates.svelte';

	export let plates: Plate[];
</script>

<Plates grid={true}>
	{#each plates as plate}
		<PlateCard {plate} />
	{/each}
</Plates>
