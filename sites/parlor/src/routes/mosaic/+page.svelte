<script lang="ts">
	import LIST from 'virtual:level-list/mosaic';
	import Mosaic from '#lib/mosaic/Mosaic.svelte';

	let { data } = $props();
</script>

<!-- Level 1: the server sends a saved game straight to its own level. -->
<Mosaic
	levels={LIST}
	start={0}
	initial={data.initial}
	levelHref={(i) => `/mosaic/${i + 1}`}
	picturesHref="/mosaic/pictures"
/>
