<script lang="ts">
	let { data } = $props();
</script>

<!-- Moving to another level keeps this component and hands it the new level's `start` and `initial`. -->
<data.Game
	levels={data.levels}
	start={data.index}
	initial={data.initial}
	levelHref={(i) => `/${data.game}/${i + 1}`}
	picturesHref="/{data.game}/pictures"
/>
