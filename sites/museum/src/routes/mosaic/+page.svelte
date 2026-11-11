<script lang="ts">
	import { GAME } from '#lib/games.js';
	import { PACKS } from '#lib/mosaic/levels/index.js';
	import { mosaicSave } from '#lib/mosaic/save.js';
	import Murals from '#lib/shared/Murals.svelte';

	let { data } = $props();
</script>

<Murals
	game={GAME.mosaic.name}
	packs={PACKS}
	gameHref="/mosaic"
	save={data.save}
	saves={mosaicSave}
/>
