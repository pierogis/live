<!--
	Forage: tap the front colony of a column; its ants eat exposed blocks of their color.
	The level's life (building, undo, restart, the end panel, saving) is the shared
	LevelControl; this keeps the picture, the colonies, the clock and the ants.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Card } from '@pierogis/utensils';

	import * as E from './engine';
	import type { Colony, Level, State } from './engine';
	import { levelDifficulty } from './difficulty';
	import { forageSave } from './save';
	import { inkOn, lighten } from '../shared/ink';
	import LevelEnd from '../shared/game/LevelEnd.svelte';
	import GameBar from '../shared/game/GameBar.svelte';
	import { LevelControl, type LevelProps } from '../shared/game/level.svelte';
	import { plural } from '../shared/game/text';
	import { AntLayer } from './ants';
	import {
		L,
		linkColors,
		lockColors,
		rails as layRails,
		segStyle,
		type Group,
		type Seg
	} from './marks';
	import '../shared/game/stage.css';

	const props: LevelProps<Level, State> = $props();

	/** Colonies shown in each lane; a count stands for the rest. */
	const VISIBLE = 3;

	let ants: AntLayer | null = null;
	let tickCount = 0;

	const ctl = new LevelControl<Level, State>(
		{
			save: forageSave,
			build: E.buildPuzzle,
			clone: E.clone,
			// Ants still walking to blocks they took finish their walk first.
			isWon: (s) => E.isWon(s) && !s.walking.length,
			isStuck: (s) => !s.walking.length && E.isStuck(s),
			reset: () => ants?.clear(),
			key: (_e, key) => {
				const n = Number(key);
				if (game && n >= 1 && n <= game.columns.length) {
					send(n - 1);
					return true;
				}
			},
			wonStatus: 'Picture cleared.',
			winDelay: 1100,
			stuckDelay: 400,
			maxHistory: 300
		},
		() => props
	);
	const game = $derived(ctl.state);

	/** Brief visual cues for a tap that can't go: a linked group, a locked column (its lane and key), the slots. */
	const flashGroup = ctl.cue(-1);
	const flashCol = ctl.cue(-1);
	const slotsFlash = ctl.cue(false);

	/** How far the front colony lightens toward white on hover; its count's ink is picked again for that shade. */
	const HOVER_LIGHTEN = 0.22;

	// ---------- what to draw ----------
	/**
	 * The parts of the state the template shows, read through `version` so moves
	 * redraw them. A block an ant has taken stays in sight until the ant gets there.
	 */
	const view = $derived.by(() => {
		void ctl.version;
		if (!game) return null;
		const alive = game.alive.slice();
		for (const a of game.walking) alive[a.cell] = true;
		return {
			alive,
			slots: game.slots.slice(),
			left: E.blocksLeft(game) + game.walking.length
		};
	});

	const board = $derived.by(() => {
		void ctl.version;
		const s = game;
		if (!s) return null;
		const out = E.outside(s);
		const keys: Record<number, number> = {};
		/** Per column: whether its lock is still there. */
		const locked = s.locks.map((cell, k) => cell >= 0 && E.hasLock(s, k, out));
		locked.forEach((on, k) => {
			if (on) keys[s.locks[k]] = k;
		});
		// Working colonies with nothing of their color to reach are just waiting.
		const hungry = s.slots.map((e) => !!e && E.isWaiting(s, e, out));
		return { out, keys, locked, hungry };
	});

	type Item = { kind: 'colony'; e: Colony; front: boolean } | { kind: 'lock'; key: number };
	/** Each column top to bottom, with its lock in front of the colony it blocks. */
	const columnItems = $derived.by(() => {
		void ctl.version;
		if (!game || !board) return [];
		const { lockAt } = game;
		const { locked } = board;
		return game.columns.map((col, k) => {
			const items: Item[] = col.map((e) => ({ kind: 'colony', e, front: false }));
			if (locked[k]) items.splice(lockAt[k], 0, { kind: 'lock', key: k });
			if (items[0]?.kind === 'colony') items[0].front = true;
			return items;
		});
	});

	const difficulty = $derived(ctl.level ? levelDifficulty(ctl.level) : null);

	/**
	 * Markers, read from the deal so sends, undo and restart never change them:
	 * each linked group's color, and each lock's color.
	 */
	const marks = $derived.by(() => {
		const deal = ctl.initial;
		return {
			link: deal ? linkColors(deal) : new Map<number, string>(),
			lock: deal ? lockColors(deal) : {}
		};
	});
	const linkColor = (e: Colony) => (e.link === undefined ? undefined : marks.link.get(e.link));

	/** Each linked group's rails in the slots and in the lanes, and the lanes' counts that hide a member. */
	const links = $derived.by(() => {
		void ctl.version;
		const collect = (
			put: (add: (e: Colony | null, col: number, depth: number) => void) => void
		) => {
			// Built fresh each time and never drawn, so it needn't be reactive.
			// eslint-disable-next-line svelte/prefer-svelte-reactivity
			const byGroup = new Map<number, Group>();
			put((e, col, depth) => {
				const g = e?.link;
				if (g === undefined) return;
				if (!byGroup.has(g)) byGroup.set(g, { g, members: [] });
				byGroup.get(g)!.members.push({ col, depth });
			});
			return [...byGroup.values()];
		};
		const inSlots = collect((add) => game?.slots.forEach((e, col) => add(e, col, 0)));
		const inLanes = collect((add) =>
			columnItems.forEach((items, col) =>
				items.forEach((item, depth) => item.kind === 'colony' && add(item.e, col, depth))
			)
		);
		const slots = layRails(inSlots, {
			cols: view?.slots.length ?? 0,
			rows: 1,
			taken: (col) => !!game?.slots[col]
		});
		const lanes = layRails(inLanes, {
			cols: columnItems.length,
			rows: VISIBLE,
			taken: (col, depth) => depth < columnItems[col].length,
			// The lanes' bottom edge, under their counts.
			floor: L(0, VISIBLE, 0, 14)
		});
		// A lane's count takes the color of the nearest group it hides a member of,
		// when that group shows a member elsewhere.
		const more: Record<number, string> = {};
		const nearest: Record<number, number> = {};
		for (const { g, members } of inLanes) {
			if (!members.some((m) => m.depth < VISIBLE)) continue;
			for (const m of members) {
				if (m.depth < VISIBLE || m.depth >= (nearest[m.col] ?? Infinity)) continue;
				nearest[m.col] = m.depth;
				more[m.col] = marks.link.get(g)!;
			}
		}
		return { slots, lanes, more };
	});

	/**
	 * The group whose lane the pointer is over, when that lane's front colony is
	 * linked: a tap sends the whole group, so every member it can see lightens.
	 */
	let hoverGroup = $state<number | undefined>(undefined);
	function hoverLane(k: number, on: boolean) {
		const head = columnItems[k]?.[0];
		hoverGroup = on && head?.kind === 'colony' ? head.e.link : undefined;
	}

	function colonyLabel(e: Colony, front: boolean) {
		if (e.mystery && !front) return 'Mystery colony';
		const name = game!.colors[e.c].key;
		return `${name} colony, ${plural(e.n, 'ant', 'ants')}${e.link !== undefined ? ', linked' : ''}`;
	}

	// ---------- moves ----------
	/** One step of time. Ants walk a tick at a time; each colony sends one every E.DISPATCH_EVERY ticks. */
	const TICK_MS = 100;

	function send(col: number) {
		const s = game;
		if (!s || ctl.overlay || E.isWon(s)) return;
		const before = E.clone(s);
		const r = E.send(s, col);
		if (!r.ok) {
			explain(r.reason, col);
			ctl.sound(0, true);
			return;
		}
		ctl.record(before);
		ctl.touch();
		ctl.sound(6);
		launch(r.dispatched);
		opened(r.unlocked);
	}

	/** Columns whose key just got uncovered. */
	function opened(cols: number[]) {
		if (!cols.length) return;
		ctl.say(`Column ${cols.map((k) => k + 1).join(' and ')} opened.`);
		ctl.sound(9);
	}

	let stageEl: HTMLElement | undefined = $state();

	let pictureEl: HTMLElement | undefined = $state();
	/**
	 * Ants leave their slot and walk the path the engine found: up out of the slot
	 * into the picture's margin, along it and in through cleared space to the food.
	 * The engine starts each path at its slot's door on the bottom edge; the walk
	 * along that edge is cut to start above the slot, where the ant comes out.
	 */
	function launch(list: E.Dispatch[]) {
		const s = game;
		if (!ants || !stageEl || !pictureEl || !s || ctl.still) return;
		const box = stageEl.getBoundingClientRect();
		const first = pictureEl.querySelector<HTMLElement>('.px');
		if (!first) return;
		// CSS sizes the picture (see .picture in the styles); read the result.
		const cellPx = first.offsetWidth;
		const pitch = cellPx + (parseFloat(getComputedStyle(pictureEl).columnGap) || 0);
		const r0 = first.getBoundingClientRect();
		const x0 = r0.left - box.left + cellPx / 2;
		const y0 = r0.top - box.top + cellPx / 2;
		const at = (p: { x: number; y: number }) => ({ x: x0 + p.x * pitch, y: y0 + p.y * pitch });
		const edgeY = at({ x: 0, y: s.h }).y;
		// Read every slot's place before any ant is added, so the page lays out once.
		const slotRects = new Map(
			list.map((d) => [
				d.slot,
				stageEl!.querySelector(`[data-slot="${d.slot}"]`)?.getBoundingClientRect()
			])
		);
		for (const d of list) {
			const slot = slotRects.get(d.slot);
			if (!slot) continue;
			const sx = slot.left + slot.width / 2 - box.left;
			const pts = E.antPath(s, d);
			// Join the path at its bottom-edge point nearest the slot.
			let j = 0;
			for (let k = 1; k < pts.length && pts[k].y === s.h; k++) {
				if (Math.abs(at(pts[k]).x - sx) < Math.abs(at(pts[j]).x - sx)) j = k;
			}
			const path = [{ x: sx, y: slot.top - box.top }, { x: sx, y: edgeY }, ...pts.slice(j).map(at)];
			ants.run(path, d.eta * TICK_MS, s.colors[d.c].hex, Math.max(3, Math.round(cellPx * 0.32)));
		}
	}

	/** One step of time: working colonies eat. Paused while the end panel shows or the picture is done. */
	function runTick() {
		const s = game;
		if (!s || ctl.overlay || ctl.won) return;
		const r = E.tick(s);
		if (r.dispatched.length) {
			ctl.touch();
			launch(r.dispatched);
		}
		opened(r.unlocked);
		if (r.eaten.length) {
			ctl.touch();
			if (tickCount++ % 2 === 0) ctl.sound(r.eaten.length + tickCount / 2, true);
		}
		// Done eating, or maybe nothing more can be: the win or stuck panel shows (after a moment).
		if (r.won || !r.eaten.length) ctl.settle();
	}

	/** A tap that can't go: show why with a quick cue, not a message. */
	function explain(reason: string, col: number) {
		if (reason === 'locked') {
			flashCol.show(col);
			ctl.say(`Column ${col + 1} is locked until its key is uncovered.`);
		} else if (reason === 'partner') {
			flashGroup.show(game?.columns[col][0]?.link ?? -1);
			ctl.say('Linked: the rest of its group has to be at the front too.');
		} else if (reason === 'no-slot') {
			slotsFlash.show(true);
			ctl.say('Every slot is busy.');
		}
	}

	onMount(() => {
		const unmount = ctl.mount();
		const clock = setInterval(runTick, TICK_MS);
		return () => {
			unmount();
			clearInterval(clock);
			ants?.clear();
		};
	});
</script>

<svelte:document onkeydown={ctl.onKey} />

<!-- Linked groups' rails: bars in the group's color in the gaps between colonies, never across one. -->
{#snippet railBars(list: { g: number; segs: Seg[] }[])}
	{#each list as r (r.g)}
		{#each r.segs as seg, j (j)}
			<span
				class="rail"
				class:flash={flashGroup.value === r.g}
				style="{segStyle(seg)};--g:{marks.link.get(r.g)}"
				aria-hidden="true"
			></span>
		{/each}
	{/each}
{/snippet}

<div class="forage" style:--w={game?.w ?? 1} style:--h={game?.h ?? 1}>
	<GameBar {...ctl.bar} game="forage" label={ctl.label} {difficulty} />

	<p class="sr-only" aria-live="polite">{ctl.status}</p>

	{#if game && board && view}
		<div
			class="stage"
			class:won={ctl.won}
			bind:this={stageEl}
			style:--n={view.slots.length}
			style:--cols={columnItems.length}
		>
			<!-- One card: the picture, and the slots and lanes under it. -->
			<div class="board snapped">
				<Card>
					{#key ctl.key}
						<div
							class="picture"
							bind:this={pictureEl}
							role="img"
							aria-label="{ctl.level.name}: {view.left} food left"
						>
							{#each game.target as c, i (i)}
								{#if view.alive[i]}
									<div class="px food" data-i={i} style:--c={game.colors[c].hex}>
										{#if i in board.keys}
											<!-- A key: ringed in its lock's color. -->
											<span
												class="key"
												class:flash={flashCol.value === board.keys[i]}
												style:--m={marks.lock[board.keys[i]]}
												title="Key for column {board.keys[i] + 1}"
											></span>
										{/if}
									</div>
								{:else if board.out[i]}
									<div class="px"></div>
								{:else}
									<div class="px sealed"></div>
								{/if}
							{/each}
						</div>
					{/key}

					<!-- Under the picture: the working slots, then the colonies' lanes. -->
					<div class="tab">
						<div class="slots" class:flash={slotsFlash.value} aria-label="Working slots">
							{#each view.slots as e, k (k)}
								<div class="slot" data-slot={k}>
									{#if e}
										{@const done = E.isDone(e)}
										{@const g = e.link}
										<div
											class="colony"
											class:linked={g !== undefined}
											class:flash={g !== undefined && flashGroup.value === g}
											style:--g={linkColor(e)}
											style:--c={game.colors[e.c].hex}
											style:--ink={inkOn(game.colors[e.c].hex)}
											aria-label="{done
												? 'Done, waiting for its linked group'
												: board.hungry[k]
													? 'Waiting'
													: 'Working'}: {colonyLabel(e, true)}"
										>
											<!-- Counts down as its ants leave. -->
											<span class="count">{done ? '✓' : e.n > 0 ? e.n : ''}</span>
										</div>
									{/if}
								</div>
							{/each}
							{@render railBars(links.slots)}
						</div>
						<!-- The end panel takes the lanes' place, so nothing on the page moves. -->
						<div class="lanes-area">
							<div class="lanes" class:hidden={!!ctl.overlay}>
								{#each columnItems as items, k (k)}
									{@const head = items[0]}
									<!-- A lane is one button: tapping it sends the colony at its front. -->
									<button
										class="lane"
										class:flash={flashCol.value === k}
										disabled={!head}
										aria-label="Column {k + 1}: {!head
											? 'empty'
											: head.kind === 'lock'
												? 'locked until its key in the picture touches the outside'
												: colonyLabel(head.e, true)}{items.length > 1
											? `, ${items.length - 1} more`
											: ''}"
										onclick={() => send(k)}
										onpointerenter={(ev) => ev.pointerType === 'mouse' && hoverLane(k, true)}
										onpointerleave={() => hoverLane(k, false)}
										onfocus={(ev) =>
											ev.currentTarget.matches(':focus-visible') && hoverLane(k, true)}
										onblur={() => hoverLane(k, false)}
									>
										{#each items.slice(0, VISIBLE) as item (item.kind === 'lock' ? 'lock' : item.e.id)}
											{#if item.kind === 'lock'}
												<!-- Ringed in its key's color. -->
												<span
													class="lock"
													style:--m={marks.lock[k]}
													title="Locked until its key in the picture touches the outside"
												>
													<svg viewBox="0 0 24 24"
														><rect x="5" y="11" width="14" height="10" rx="2" /><path
															d="M8 11V7a4 4 0 0 1 8 0v4"
														/></svg
													>
												</span>
											{:else}
												{@const e = item.e}
												{@const hidden = !item.front && !!e.mystery}
												{@const g = e.link}
												{@const lights = item.front || g !== undefined}
												<span
													class="colony"
													class:front={item.front}
													class:linked={g !== undefined}
													class:lit={g !== undefined && hoverGroup === g}
													class:flash={g !== undefined && flashGroup.value === g}
													style:--g={linkColor(e)}
													style:--c={hidden ? 'var(--hole)' : game.colors[e.c].hex}
													style:--ink={hidden ? 'var(--text-color)' : inkOn(game.colors[e.c].hex)}
													style:--c-hover={lights && !hidden
														? lighten(game.colors[e.c].hex, HOVER_LIGHTEN)
														: undefined}
													style:--ink-hover={lights && !hidden
														? inkOn(lighten(game.colors[e.c].hex, HOVER_LIGHTEN))
														: undefined}
												>
													<span class="count">{hidden ? '?' : e.n}</span>
												</span>
											{/if}
										{/each}
										{#if items.length > VISIBLE}<span
												class="more"
												class:linked={k in links.more}
												style:--g={links.more[k]}>+{items.length - VISIBLE}</span
											>{/if}
									</button>
								{/each}
								{@render railBars(links.lanes)}
							</div>
							{#if ctl.overlay}
								<LevelEnd
									{...ctl.end}
									text={ctl.overlay === 'win'
										? `${ctl.level.name} cleared.`
										: 'every slot is busy and no colony at the front can finish'}
								/>
							{/if}
						</div>
					</div>
				</Card>
			</div>
			<div
				class="ant-layer"
				{@attach (node) => {
					ants = new AntLayer(node);
				}}
				aria-hidden="true"
			></div>
		</div>
	{/if}
</div>

<style>
	/* Forage follows the site's look: flat colors, 2px inset rings, Courier for numbers. */
	/*
	 * The picture sizes itself: a food's pitch is as big as fits the row's width
	 * (container units) and half the small viewport height (steady while a phone's
	 * address bar comes and goes), with a walking margin of a cell all around.
	 */
	.forage {
		container-type: inline-size;
		--gap: 2px;
		--room-w: calc(min(100cqw, 640px) - 40px);
		--room-h: max(50svh, 180px);
		/* Whole pixels, so every piece of food sits on the pixel grid. */
		--pitch: round(
			down,
			clamp(
				8px,
				min(calc(var(--room-w) / (var(--w) + 2)), calc(var(--room-h) / (var(--h) + 2))),
				24px
			),
			1px
		);
		--cell: calc(var(--pitch) - var(--gap));
		/* The picture with its walking ring, (w + 2) cells and (w + 3) gaps, in the card's bevel. */
		--picture-w: calc((var(--w) + 2) * var(--pitch) + var(--gap) + 2 * var(--border-size));
		--slot-size: 52px;
		--colony: 36px;
		--muted: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
		--hole: color-mix(in srgb, var(--text-color) 18%, var(--primary-color));
		--well: color-mix(in srgb, var(--text-color) 7%, var(--primary-color));

		/*
		 * The page centers its content, which can land on half a pixel. So the game
		 * spans the content and centers itself with whole-pixel padding, and its parts
		 * are centered with whole-pixel margins (--snap-w) rather than by flex.
		 */
		box-sizing: border-box;
		width: 100%;
		padding-inline: max(0px, round(down, calc((100% - 720px) / 2), 1px));
		/* Quick taps are moves, so a double tap shouldn't zoom the page. Pinch still does. */
		touch-action: manipulation;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 10px;
		-webkit-tap-highlight-color: transparent;
	}
	svg {
		width: 18px;
		height: 18px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/*
	 * The picture and the slots are one card (stage.css), so the ants walk out of
	 * their slot straight into the picture's margin. The card is as wide as the
	 * wider of the picture and the slots or lanes.
	 */
	.stage {
		/* Slots and lanes share one pitch, so a colony is the same size in both. */
		--lane-pitch: calc(var(--slot-size) + 8px);
		--pad: calc((var(--slot-size) - var(--colony)) / 2);
		--slots-w: calc(var(--n) * var(--slot-size) + (var(--n) - 1) * 8px);
		--lanes-w: calc(var(--cols) * var(--slot-size) + (var(--cols) - 1) * 8px);
		/* The tab's side padding (roomier than its 8px top and bottom) and bevel on each side. */
		--tab-pad: 14px;
		--tab-edges: calc(2 * (var(--tab-pad) + var(--border-size)));
		--tab-w: calc(max(var(--slots-w), var(--lanes-w)) + var(--tab-edges));
		/* The card's width, bevel and all. */
		--board-w: min(100cqw, max(var(--picture-w), var(--tab-w)));
		position: relative;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-top: 4px;
	}
	/* Inside the tab, the slots and the lanes are each centered on whole pixels. */
	.slots,
	.lanes {
		position: relative;
		margin-left: round(down, calc((var(--board-w) - var(--tab-edges) - var(--row-w)) / 2), 1px);
	}
	.board {
		--snap-w: var(--board-w);
		width: var(--board-w);
	}
	.picture {
		--ring: calc(var(--cell) + var(--gap) * 2);
		display: grid;
		grid-template-columns: repeat(var(--w), var(--cell));
		gap: var(--gap);
		/* Room around the edge for the ants to walk, and any extra width split evenly. */
		padding: var(--ring);
		padding-left: calc(
			var(--ring) + round(down, calc((var(--board-w) - var(--picture-w)) / 2), 1px)
		);
		user-select: none;
	}
	.px {
		width: var(--cell);
		height: var(--cell);
		position: relative;
	}
	/* Each food is its own piece, so you can count what a colony is up against. */
	.food {
		background: var(--c);
		border-radius: 2px;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
	}
	.sealed {
		background: var(--hole);
		border-radius: 2px;
	}
	/*
	 * A lock and its key share a marker color, only ever as a ring, never a fill,
	 * so a marker can't pass for food.
	 * A key keeps its food's color, ringed in its lock's color with a thin grey edge,
	 * so it shows on any food.
	 */
	.key {
		position: absolute;
		inset: -3px;
		border-radius: 4px;
		z-index: 2;
		box-shadow:
			inset 0 0 0 2px var(--m),
			0 0 0 1px var(--text-color-st);
	}
	.key::before {
		content: '';
		position: absolute;
		inset: 3px;
		border-radius: 1px;
		background: var(--c);
	}
	.key.flash {
		box-shadow:
			inset 0 0 0 2px var(--m),
			0 0 0 3px var(--accent-color);
	}

	.ant-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 20;
	}
	/* An ant is a small round dot of its food's color, ringed like the site's other pieces. */
	.ant-layer :global(.ant) {
		position: absolute;
		width: var(--size);
		height: var(--size);
		margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
		border-radius: 50%;
		background: var(--crumb);
		box-shadow: 0 0 0 1px var(--text-color-st);
		will-change: transform;
	}

	/* The tab: working slots on top, the colonies' lanes under them. */
	.tab {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 8px var(--tab-pad);
	}
	.slots {
		--row-w: var(--slots-w);
		display: flex;
		gap: 8px;
	}
	.slots.flash .slot {
		box-shadow:
			var(--inset),
			0 0 0 2px var(--accent-color);
	}
	.slot {
		width: var(--slot-size);
		height: var(--slot-size);
		border-radius: 10px;
		background: var(--well);
		box-shadow: var(--inset);
		display: grid;
		place-items: center;
	}

	/* Lanes: the end panel and the lanes share one spot. */
	.lanes-area {
		align-self: stretch;
		display: grid;
	}
	.lanes-area > :global(*) {
		grid-area: 1 / 1;
	}
	.lanes {
		--row-w: var(--lanes-w);
		display: grid;
		grid-template-columns: repeat(var(--cols), var(--slot-size));
		gap: 8px;
	}
	/*
	 * A lane holds its colonies on the slots' pitch, front at the top. It's fixed
	 * at three colonies tall (plus a count of the rest), so the page never moves.
	 */
	.lane {
		position: relative;
		z-index: 0;
		box-sizing: border-box;
		width: var(--slot-size);
		height: calc(var(--slot-size) * 3 + 14px);
		padding: var(--pad) 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(2 * var(--pad));
		border: 0;
		border-radius: 10px;
		background: var(--well);
		box-shadow: var(--inset);
		color: var(--text-color);
		cursor: pointer;
	}
	/*
	 * The whole lane takes the tap, but only the front colony, what a tap sends,
	 * shows it: it lightens on hover and presses down when tapped. When it's
	 * linked, the rest of its group lightens with it (.lit), since they go too.
	 */
	.colony.front,
	.colony.linked {
		transition: background-color 150ms;
	}
	.lane:not(:disabled):hover .colony.front,
	.lane:focus-visible .colony.front,
	.colony.lit {
		background: var(--c-hover, color-mix(in srgb, var(--c), white 22%));
	}
	.lane:not(:disabled):hover .colony.front .count,
	.lane:focus-visible .colony.front .count,
	.colony.lit .count {
		color: var(--ink-hover, var(--ink));
	}
	.lane:not(:disabled):active .colony.front {
		transform: translate(0, 1px);
	}
	.lane:disabled {
		cursor: default;
	}
	.lane.flash {
		box-shadow:
			var(--inset),
			0 0 0 2px var(--accent-color);
	}
	.colony {
		/* Its own ring; a linked colony adds its group's halo outside it. */
		--ring: var(--inset);
		position: relative;
		flex: none;
		width: var(--colony);
		height: var(--colony);
		border-radius: 10px;
		background: var(--c);
		color: var(--ink);
		display: grid;
		place-items: center;
		padding: 0;
		box-shadow: var(--ring);
		font-family: Courier, monospace;
		font-weight: 700;
		font-size: 15px;
	}
	/* The site styles every element's text and font, so the count sets its own. */
	.count {
		color: var(--ink);
		font: inherit;
	}
	/*
	 * The front colony, what a tap sends, is raised like a key: a solid ring and a
	 * lip along its bottom. The ones behind lie flat in full color.
	 */
	.colony.front {
		--ring: inset 0 0 0 2px var(--text-color), inset 0 -5px 0 rgb(0 0 0 / 0.22);
		padding-bottom: 3px;
	}
	/*
	 * A linked colony wears its group's color as a 2px halo just outside, with a
	 * thin gap so it never runs into the colony's own color. Its rails meet the halo.
	 */
	.colony.linked {
		box-shadow:
			var(--ring),
			0 0 0 calc(var(--pad) / 2 - 2px) var(--well),
			0 0 0 calc(var(--pad) / 2) var(--g);
	}
	.colony.flash {
		box-shadow:
			var(--ring),
			0 0 0 3px var(--accent-color);
	}
	/* A lock sits in the lane in front of the colonies it holds back, ringed in its key's color. */
	.lock {
		position: relative;
		flex: none;
		width: var(--colony);
		height: var(--colony);
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: var(--text-color);
		background: var(--well);
		box-shadow: inset 0 0 0 3px var(--m);
	}
	/* A rail: one bar of a linked group's path, over the lanes, in the group's color. */
	.rail {
		position: absolute;
		z-index: 1;
		pointer-events: none;
		border-radius: 2px;
		background: var(--g);
	}
	.rail.flash {
		box-shadow: 0 0 0 2px var(--accent-color);
	}
	/* How many more wait behind the three shown, along the lane's bottom. */
	.more {
		position: absolute;
		bottom: 2px;
		left: 0;
		right: 0;
		text-align: center;
		line-height: 12px;
		font-family: Courier, monospace;
		font-size: 12px;
		color: var(--muted);
	}
	/* A count hiding a linked colony takes its group's color; that group's rail ends under it. */
	.more.linked {
		color: var(--g);
		font-weight: 700;
	}

	/* The lanes give way to the level end, keeping their room. */
	.hidden {
		visibility: hidden;
	}
	@media (max-width: 420px) {
		.forage {
			--slot-size: 44px;
			--colony: 32px;
		}
		.colony {
			font-size: 14px;
		}
	}
	@media (max-width: 500px) {
		/* Phones: the picture takes the full width (the page scrolls if the colonies end up below). */
		.forage {
			--gap: 1px;
			--room-w: calc(100cqw - 8px - 2 * var(--border-size));
			--pitch: round(down, clamp(8px, calc(var(--room-w) / (var(--w) + 2)), 24px), 1px);
		}
		:global(body .content:has(> .forage)) {
			padding-left: 6px;
			padding-right: 6px;
		}
	}
</style>
