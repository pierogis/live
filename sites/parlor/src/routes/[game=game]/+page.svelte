<script lang="ts">
	let { data } = $props();
</script>

<!-- Level 1: the server sends a saved game straight to its own level. -->
<data.Game
	levels={data.levels}
	start={0}
	initial={data.initial}
	levelHref={(i) => `/${data.game}/${i + 1}`}
	picturesHref="/{data.game}/pictures"
/>
