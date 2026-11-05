<script lang="ts">
	import Mosaic from '#lib/mosaic/Mosaic.svelte';
	import { LEVELS } from '#lib/mosaic/levels/index.js';
</script>

<!-- Arrives as level 1, then moves to the saved level. -->
<Mosaic
	levels={LEVELS}
	start={0}
	resume
	levelHref={(i) => `/mosaic/${i + 1}`}
	picturesHref="/mosaic/pictures"
/>
