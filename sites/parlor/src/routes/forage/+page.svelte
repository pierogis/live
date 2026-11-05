<script lang="ts">
	import Forage from '#lib/forage/Forage.svelte';
	import { LEVELS } from '#lib/forage/levels/index.js';
</script>

<!-- Arrives as level 1, then moves to the saved level. -->
<Forage
	levels={LEVELS}
	start={0}
	resume
	levelHref={(i) => `/forage/${i + 1}`}
	picturesHref="/forage/pictures"
/>
