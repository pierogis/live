<script lang="ts">
	import LIST from 'virtual:level-list/forage';
	import Forage from '#lib/forage/Forage.svelte';

	let { data } = $props();
</script>

<Forage
	levels={LIST}
	start={data.index}
	initial={data.initial}
	levelHref={(i) => `/forage/${LIST[i].id}`}
	muralsHref="/forage"
/>
