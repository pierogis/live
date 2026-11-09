<script lang="ts">
	import LIST from 'virtual:level-list/forage';
	import Forage from '#lib/forage/Forage.svelte';

	let { data } = $props();
</script>

<!-- Level 1: the server sends a saved game straight to its own level. -->
<Forage
	levels={LIST}
	start={0}
	initial={data.initial}
	levelHref={(i) => `/forage/${i + 1}`}
	picturesHref="/forage/pictures"
/>
