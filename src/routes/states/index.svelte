<script lang="ts">
	import type { Plate } from '$lib/models';

	import Plates from '$lib/components/Plates.svelte';
	import PlateCard from '$lib/components/PlateCard.svelte';

	export let states: { [key: string]: Plate };
</script>

<Plates grid={true}>
	{#each Object.entries(states) as [state, plate]}
		<PlateCard {plate} showState={true} showYears={false} showScores={false} />
	{/each}
</Plates>
