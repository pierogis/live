<script lang="ts">
	import Mosaic from '#lib/mosaic/Mosaic.svelte';
	import { LEVELS } from '#lib/mosaic/levels/index.js';

	let { data } = $props();
</script>

<Mosaic
	levels={LEVELS}
	start={data.index}
	levelHref={(i) => `/mosaic/${i + 1}`}
	picturesHref="/mosaic/pictures"
/>
