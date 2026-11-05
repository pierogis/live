<!--
	Every picture of a game, by pack. Each one links to its level page. The save comes
	from the server (read from the game's cookie), so your ✓ marks are there at once.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	import { art } from './art';
	import { LABELS } from './difficulty';
	import type { Save } from './save';
	import type { Picture } from './editor/checks';

	interface Props {
		/** The game's name, for the title. */
		game: string;
		packs: { id: string; name: string; levels: Picture[] }[];
		/** The game page; each picture links to `${gameHref}/N`. */
		gameHref: string;
		save: Save;
		/** A level's difficulty from 1 to 5, when the game has one. */
		difficulty?: (level: Picture) => number | null;
		/** Game options shown above the pictures, like Mosaic's relaxed mode. */
		extra?: Snippet;
	}

	let { game, packs, gameHref, save, difficulty, extra }: Props = $props();

	const sections = $derived.by(() => {
		let at = 0;
		return packs.map((p) => ({ name: p.name, items: p.levels.map((lv) => ({ lv, n: ++at })) }));
	});
</script>

<div class="pictures">
	<div class="bar">
		<h2>{game} · pictures</h2>
		<a class="border inset link-box" href="{gameHref}/{save.level + 1}">back to the game</a>
	</div>

	{@render extra?.()}

	{#each sections as section (section.name)}
		<h3>{section.name.toLowerCase()}</h3>
		<div class="grid">
			{#each section.items as { lv, n } (lv.id)}
				{@const done = !!save.completed[lv.id]}
				{@const d = difficulty?.(lv) ?? null}
				<a
					class="card inset"
					class:current={save.level === n - 1}
					href="{gameHref}/{n}"
					aria-label="{n}. {lv.name}{d ? `, ${LABELS[d - 1]}` : ''}{done ? ', complete' : ''}"
				>
					<span class="thumb" class:unplayed={!done}
						><canvas {@attach art(lv, true, 72)}></canvas></span
					>
					<span>{n}. {lv.name}</span>
					{#if d}
						<span class="pips" title="{LABELS[d - 1]}: difficulty {d} of 5"
							>{'●'.repeat(d)}{'○'.repeat(5 - d)}</span
						>
					{/if}
					{#if done}<span class="done" aria-hidden="true">✓</span>{/if}
				</a>
			{/each}
		</div>
	{/each}
</div>

<style>
	.pictures {
		width: 100%;
		max-width: 760px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	h2 {
		font-size: 20px;
	}
	h3 {
		margin-top: 12px;
		font-size: 14px;
		color: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(116px, 1fr));
		gap: 10px;
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 12px 8px 10px;
		border-radius: 10px;
		background: var(--primary-color);
		text-align: center;
		font-size: 13px;
		font-weight: 600;
	}
	.card:hover {
		box-shadow: var(--inset), var(--shadow);
	}
	.card.current {
		box-shadow:
			var(--inset),
			0 0 0 3px var(--secondary-color);
	}
	.thumb {
		height: 72px;
		display: grid;
		place-items: center;
	}
	canvas {
		image-rendering: pixelated;
	}
	/* Pictures fill their frames, so an unplayed one shows faded rather than as a blank shape. */
	.thumb.unplayed canvas {
		filter: grayscale(0.85) opacity(0.55);
	}
	.pips {
		letter-spacing: 1px;
		font-size: 11px;
		color: var(--accent-color);
	}
	.done {
		position: absolute;
		top: 6px;
		right: 8px;
		color: var(--link-color);
		font-weight: 800;
	}
</style>
