<script lang="ts">
	import LIST from 'virtual:level-list/mosaic';
	import Mosaic from '#lib/mosaic/Mosaic.svelte';

	let { data } = $props();
</script>

<!-- Moving to another level keeps this component and hands it the new level's `start` and `initial`. -->
<Mosaic
	levels={LIST}
	start={data.index}
	initial={data.initial}
	levelHref={(i) => `/mosaic/${i + 1}`}
	picturesHref="/mosaic/pictures"
/>
