<script lang="ts">
	import PlateCard from '$lib/PlateCard.svelte';
	import type { Plate } from '$lib/plates';

	import Plates from '$lib/Plates.svelte';

	export let states: { [key: string]: Plate };
</script>

<Plates grid={true}>
	{#each Object.entries(states) as [state, plate]}
		<PlateCard {plate} showScores={false} showYears={false} />
	{/each}
</Plates>
