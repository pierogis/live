<script lang="ts">
	import PlateCard from '$lib/components/PlateCard.svelte';
	import Plates from '$lib/components/Plates.svelte';
	import type { Plate } from '$lib/models';

	export let plates: Plate[];
</script>

<div class="state">
	<div class="state-description">Ah, the sunshine state</div>

	<div class="state-plates">
		<Plates grid={true}>
			{#each plates as plate}
				<PlateCard {plate} showState={false} />
			{/each}
		</Plates>
	</div>
</div>

<style>
	.state {
		display: flex;
		flex-direction: row;
	}
	.state-description {
		flex: 1;
		padding: 16px;
		font-size: 0.8em;
	}
	.state-plates {
		flex: 3;
		border-left: 10px solid var(--accent-color);
	}
</style>
