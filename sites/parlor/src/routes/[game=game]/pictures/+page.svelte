<script lang="ts">
	import Pictures from '#lib/shared/Pictures.svelte';

	let { data } = $props();
	const { game, parts } = $derived(data);
</script>

<Pictures
	game={game.name}
	packs={parts.PACKS}
	gameHref="/{game.id}"
	save={data.save}
	difficulty={parts.difficulty}
	saves={parts.save}
/>
