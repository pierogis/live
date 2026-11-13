<script lang="ts" generics="L extends Picture">
	import { Card } from '@pierogis/utensils';
	import { untrack } from 'svelte';

	import { art } from './art';
	import { LABELS } from './difficulty';
	import Pips from './game/Pips.svelte';
	import type { Pack, Picture } from './level';
	import type { GameSave, Save } from './save';

	interface Props {
		game: string;
		packs: Pack<L>[];
		gameHref: string;
		save: Save;
		difficulty?: (level: L) => number | null;
		saves?: GameSave;
	}

	let { game, packs, gameHref, save, difficulty, saves }: Props = $props();

	const options = $state(untrack(() => ({ ...save.options })));

	function toggle(key: string, on: boolean) {
		options[key] = on;
		saves?.update((s) => {
			s.options[key] = on;
		});
	}

	const played = $derived(save.level > 0 || Object.keys(save.completed).length > 0);
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
		<h2>{game} · murals</h2>
		<a class="border inset link-box" href="{gameHref}/{saved.id}">{played ? 'resume' : 'start'}</a>
	</div>

	{#each saves?.options ?? [] as option (option.key)}
		<div class="option-card">
			<Card>
				<label class="option">
					<input
						type="checkbox"
						checked={!!options[option.key]}
						onchange={(e) => toggle(option.key, e.currentTarget.checked)}
					/>
					<span
						><b>{option.label}</b>{#if option.note}<br /><small>{option.note}</small>{/if}</span
					>
				</label>
			</Card>
		</div>
	{/each}

	{#each sections as section (section.name)}
		{#if section.mural}
			{@const panel = section.items[0].lv.art}
			<h3>
				{section.name.toLowerCase()} ·
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
								id={lv.id}
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
						id={lv.id}
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
	.option-card {
		align-self: flex-start;
	}
	.option-card :global(.card) {
		height: auto;
	}
	.option {
		display: flex;
		gap: 10px;
		align-items: center;
		cursor: pointer;
	}
	.option input {
		margin: 0;
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
	.frame {
		align-self: center;
	}
	.frame :global(.card) {
		padding: 2px;
		height: auto;
	}
	.mural {
		--s: 3px;
		border-radius: 4px;
		overflow: hidden;
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
	/* The breakpoints above are for browsers without round(). */
	@supports (width: round(down, 1px, 1px)) {
		.mural {
			--fit: calc((100cqi - 24px - (var(--cols) - 1) * 2px) / (var(--cols) * var(--w)));
			--s: min(clamp(2px, round(down, var(--fit), 1px), 7px), var(--fit));
		}
	}
	.panel,
	.card {
		scroll-margin-top: 33svh;
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
		outline-offset: -3px;
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
