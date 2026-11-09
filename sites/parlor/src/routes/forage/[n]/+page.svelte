<script lang="ts">
	import LIST from 'virtual:level-list/forage';
	import Forage from '#lib/forage/Forage.svelte';

	let { data } = $props();
</script>

<!-- Moving to another level keeps this component and hands it the new level's `start` and `initial`. -->
<Forage
	levels={LIST}
	start={data.index}
	initial={data.initial}
	levelHref={(i) => `/forage/${i + 1}`}
	picturesHref="/forage/pictures"
/>
