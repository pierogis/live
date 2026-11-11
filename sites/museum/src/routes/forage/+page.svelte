<script lang="ts">
	import { levelDifficulty } from '#lib/forage/difficulty.js';
	import { PACKS } from '#lib/forage/levels/index.js';
	import { forageSave } from '#lib/forage/save.js';
	import { GAME } from '#lib/games.js';
	import Murals from '#lib/shared/Murals.svelte';

	let { data } = $props();
</script>

<Murals
	game={GAME.forage.name}
	packs={PACKS}
	gameHref="/forage"
	save={data.save}
	difficulty={levelDifficulty}
	saves={forageSave}
/>
