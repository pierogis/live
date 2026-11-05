<script lang="ts">
	import Pictures from '#lib/shared/Pictures.svelte';
	import { difficultyIndex } from '#lib/shared/difficulty.js';
	import { PACKS } from '#lib/forage/levels/index.js';

	let { data } = $props();
</script>

<Pictures
	game="forage"
	packs={PACKS}
	gameHref="/forage"
	save={data.save}
	difficulty={(lv) => difficultyIndex((lv as { wins?: number }).wins)}
/>
