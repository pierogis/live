<!--
	Every picture of a game, by pack. Each one links to its level page. The save comes
	from the server (read from the game's cookie), so your ✓ marks are there at once.
	The game's options show above the pictures as toggles.
-->
<script lang="ts" generics="L extends Picture">
	import { Card } from '@pierogis/utensils';
	import { untrack } from 'svelte';

	import { art } from './art';
	import { LABELS } from './difficulty';
	import Pips from './game/Pips.svelte';
	import type { Pack, Picture } from './level';
	import type { GameSave, Save } from './save';

	interface Props {
		/** The game's name, for the title. */
		game: string;
		packs: Pack<L>[];
		/** The game page; each picture links to `${gameHref}/<level id>`. */
		gameHref: string;
		save: Save;
		/** A level's difficulty from 1 to 5, when the game has one. */
		difficulty?: (level: L) => number | null;
		/** The game's save functions, when it has options (like Mosaic's relaxed mode) to toggle. */
		saves?: GameSave;
	}

	let { game, packs, gameHref, save, difficulty, saves }: Props = $props();

	// Each toggle starts from your saved setting and saves straight to your cookie,
	// changing only that setting, so progress from another tab stays.
	const options = $state(untrack(() => ({ ...save.options })));

	function toggle(key: string, on: boolean) {
		options[key] = on;
		saves?.update((s) => {
			s.options[key] = on;
		});
	}

	/** The level your save is on, or the first. */
	const saved = $derived(packs.flatMap((p) => p.levels)[save.level] ?? packs[0].levels[0]);

	const sections = $derived.by(() => {
		let at = 0;
		return packs.map((p) => ({
			name: p.name,
			mural: p.mural,
			items: p.levels.map((lv) => ({ lv, n: ++at }))
		}));
	});
</script>

<div class="pictures">
	<div class="bar">
		<h2>{game} · pictures</h2>
		<a class="border inset link-box" href="{gameHref}/{saved.id}">back to the game</a>
	</div>

	{#each saves?.options ?? [] as option (option.key)}
		<label class="option inset">
			<input
				type="checkbox"
				checked={!!options[option.key]}
				onchange={(e) => toggle(option.key, e.currentTarget.checked)}
			/>
			<span
				><b>{option.label}</b>{#if option.note}<br /><small>{option.note}</small>{/if}</span
			>
		</label>
	{/each}

	{#each sections as section (section.name)}
		{#if section.mural}
			{@const panel = section.items[0].lv.art}
			<!-- A mural: its panels side by side as one picture in a card, each a link to its level. -->
			<h3>
				{section.name.toLowerCase()} · mural ·
				{section.items.filter((i) => save.completed[i.lv.id]).length} / {section.items.length}
			</h3>
			<div class="frame">
				<Card>
					<div
						class="mural"
						style:--cols={section.mural.cols}
						style:--w={panel[0].length}
						style:--h={panel.length}
					>
						{#each section.items as { lv, n } (lv.id)}
							{@const done = !!save.completed[lv.id]}
							<a
								class="panel"
								class:unplayed={!done}
								class:current={save.level === n - 1}
								href="{gameHref}/{lv.id}"
								title="{n}. {lv.name}"
								aria-label="{n}. {lv.name}{done ? ', complete' : ''}"
							>
								<canvas {@attach art(lv, 0)}></canvas>
							</a>
						{/each}
					</div>
				</Card>
			</div>
		{:else}
			<h3>{section.name.toLowerCase()}</h3>
			<div class="grid">
				{#each section.items as { lv, n } (lv.id)}
					{@const done = !!save.completed[lv.id]}
					{@const d = difficulty?.(lv) ?? null}
					<a
						class="card inset"
						class:current={save.level === n - 1}
						href="{gameHref}/{lv.id}"
						aria-label="{n}. {lv.name}{d ? `, ${LABELS[d - 1]}` : ''}{done ? ', complete' : ''}"
					>
						<span class="thumb" class:unplayed={!done}><canvas {@attach art(lv, 72)}></canvas></span
						>
						<span>{n}. {lv.name}</span>
						{#if d}<Pips difficulty={d} />{/if}
						{#if done}<span class="done" aria-hidden="true">✓</span>{/if}
					</a>
				{/each}
			</div>
		{/if}
	{/each}
</div>

<style>
	.pictures {
		container-type: inline-size;
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
	.option {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		padding: 12px;
		border-radius: 10px;
		cursor: pointer;
	}
	.option input {
		margin-top: 3px;
		width: 18px;
		height: 18px;
		accent-color: var(--accent-color);
	}
	.option small {
		color: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
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
	/* The card hugs its mural: no padding, and only as wide as the picture. */
	.frame {
		align-self: center;
	}
	.frame :global(.card) {
		padding: 0;
		height: auto;
	}
	/*
	 * A mural's panels. Each dot is a whole number of pixels (--s): as many as fit the page
	 * for this mural's width in dots, up to 7. The steps by page width are for browsers
	 * without round().
	 */
	.mural {
		--s: 3px;
		display: grid;
		grid-template-columns: repeat(var(--cols), max-content);
		gap: 2px;
		justify-content: center;
	}
	@media (min-width: 560px) {
		.mural {
			--s: 5px;
		}
	}
	@media (min-width: 780px) {
		.mural {
			--s: 7px;
		}
	}
	@supports (width: round(down, 1px, 1px)) {
		.mural {
			--s: clamp(2px, round(down, (100cqi - 24px) / (var(--cols) * var(--w)), 1px), 7px);
		}
	}
	.panel {
		display: block;
		line-height: 0;
	}
	.panel canvas {
		width: calc(var(--w) * var(--s));
		height: calc(var(--h) * var(--s));
	}
	.panel.unplayed canvas {
		filter: grayscale(0.85) opacity(0.4);
	}
	.panel:hover canvas {
		filter: none;
	}
	.panel.current {
		outline: 3px solid var(--secondary-color);
		position: relative;
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
	.done {
		position: absolute;
		top: 6px;
		right: 8px;
		color: var(--link-color);
		font-weight: 800;
	}
</style>
