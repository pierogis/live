<script lang="ts">
	import Forage from '#lib/forage/Forage.svelte';
	import { LEVELS } from '#lib/forage/levels/index.js';

	let { data } = $props();
</script>

<Forage
	levels={LEVELS}
	start={data.index}
	levelHref={(i) => `/forage/${i + 1}`}
	picturesHref="/forage/pictures"
/>
