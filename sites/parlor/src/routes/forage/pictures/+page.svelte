<script lang="ts">
	import { levelDifficulty } from '#lib/forage/difficulty.js';
	import { PACKS } from '#lib/forage/levels/index.js';
	import { forageSave } from '#lib/forage/save.js';
	import { GAME } from '#lib/games.js';
	import Pictures from '#lib/shared/Pictures.svelte';

	let { data } = $props();
</script>

<Pictures
	game={GAME.forage.name}
	packs={PACKS}
	gameHref="/forage"
	save={data.save}
	difficulty={levelDifficulty}
	saves={forageSave}
/>
