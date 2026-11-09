<script lang="ts">
	import { GAME } from '#lib/games.js';
	import { PACKS } from '#lib/mosaic/levels/index.js';
	import { mosaicSave } from '#lib/mosaic/save.js';
	import Pictures from '#lib/shared/Pictures.svelte';

	let { data } = $props();
</script>

<Pictures
	game={GAME.mosaic.name}
	packs={PACKS}
	gameHref="/mosaic"
	save={data.save}
	saves={mosaicSave}
/>
