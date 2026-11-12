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
	import LevelNav from '../shared/game/LevelNav.svelte';
	import { LevelControl, type LevelProps } from '../shared/game/level.svelte';
	import { plural } from '../shared/game/text';
	import { AntLayer } from './ants';
	import {
		GAP,
		linkColors,
		lockColors,
		rails as layRails,
		segStyle,
		type Group,
		type Seg
	} from './marks';
	import '../shared/game/stage.css';

	const props: LevelProps<Level, State> = $props();

	const VISIBLE = 3;

	const TICK_MS = 100;
	const BEAT_TICKS = 2;

	let ants: AntLayer | null = null;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	let finished = new Set<number>();

	function checkFinished(c: number) {
		const s = game;
		if (!s || finished.has(c)) return;
		const hex = s.colors[c].hex;
		if (ants?.coming(hex) || E.foodLeft(s, c)) return;
		finished.add(c);
		ctl.finished(hex);
	}

	function arrived(hex: string, at: number) {
		ctl.touch();
		ctl.music?.note(hex, false, at);
		const c = game?.colors.findIndex((x) => x.hex === hex) ?? -1;
		if (c >= 0) checkFinished(c);
		if (game && E.isWon(game)) settle();
	}

	const ctl = new LevelControl<Level, State>(
		{
			save: forageSave,
			clone: E.clone,
			isWon: E.isWon,
			isStuck: E.isStuck,
			reset: (s) => {
				ants?.clear();
				finished = new Set(s.colors.map((_, c) => c).filter((c) => !E.foodLeft(s, c)));
			},
			rhythm: {
				beat: TICK_MS,
				fill: true,
				warm: 0.05,
				bend: true,
				harmonize: 'soft',
				feel: 'light'
			},
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

	const flashGroup = ctl.cue(-1);
	const flashCol = ctl.cue(-1);
	const slotsFlash = ctl.cue(false);

	const HOVER_LIGHTEN = 0.22;

	const view = $derived.by(() => {
		void ctl.version;
		if (!game) return null;
		const alive = game.alive.slice();
		for (const cell of ants?.bound ?? []) alive[cell] = true;
		return {
			alive,
			slots: game.slots.slice(),
			left: E.blocksLeft(game),
			dispensers: new Map(game.dispensers?.map((d) => [d.cell, E.dispensing(d)]))
		};
	});

	const board = $derived.by(() => {
		void ctl.version;
		const s = game;
		if (!s) return null;
		const out = E.outside(s);
		const keys: Record<number, number> = {};
		const locked = s.locks.map((cell, k) => cell >= 0 && E.hasLock(s, k, out));
		locked.forEach((on, k) => {
			if (on) keys[s.locks[k]] = k;
		});
		const hungry = s.slots.map((e) => !!e && E.isWaiting(s, e, out));
		return { out, keys, locked, hungry };
	});

	type Item = { kind: 'colony'; e: Colony; front: boolean } | { kind: 'lock'; key: number };
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

	const marks = $derived.by(() => {
		const deal = ctl.initial;
		return {
			link: deal ? linkColors(deal) : new Map<number, string>(),
			lock: deal ? lockColors(deal) : {}
		};
	});
	const linkColor = (e: Colony) => (e.link === undefined ? undefined : marks.link.get(e.link));

	const links = $derived.by(() => {
		void ctl.version;
		const collect = (
			put: (add: (e: Colony | null, col: number, depth: number) => void) => void
		) => {
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
			channels: true
		});
		const late: Record<number, { g: number; color: string }[]> = {};
		columnItems.forEach((items, col) => {
			for (const item of items.slice(VISIBLE)) {
				const g = item.kind === 'colony' ? item.e.link : undefined;
				if (g === undefined || late[col]?.some((r) => r.g === g)) continue;
				(late[col] ??= []).push({ g, color: marks.link.get(g)! });
			}
		});
		return { slots, lanes, late };
	});

	let hoverGroup = $state<number | undefined>(undefined);
	function hoverLane(k: number, on: boolean) {
		const head = columnItems[k]?.[0];
		hoverGroup = on && head?.kind === 'colony' ? head.e.link : undefined;
	}

	function colonyLabel(e: Colony) {
		const name = game!.colors[e.c].key;
		return `${name} colony, ${plural(e.n, 'ant', 'ants')}${e.link !== undefined ? ', linked' : ''}`;
	}

	let lastTick = 0;

	function send(col: number) {
		const s = game;
		if (!s || ctl.overlay || E.isWon(s)) return;
		const before = E.clone(s);
		const r = E.send(s, col);
		if (!r.ok) {
			explain(r.reason, col);
			ctl.music?.nope();
			return;
		}
		ctl.record(before);
		ctl.touch();
		ctl.music?.tap();
		launch(r.dispatched);
	}

	let stageEl: HTMLElement | undefined = $state();

	let pictureEl: HTMLElement | undefined = $state();
	function launch(list: E.Dispatch[]) {
		const s = game;
		if (!ants || !stageEl || !pictureEl || !s || ctl.still) return;
		const box = stageEl.getBoundingClientRect();
		const first = pictureEl.querySelector<HTMLElement>('.px');
		if (!first) return;
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
		ctl.clock.crowd(ants.bound.size + list.length);
		for (const d of list) {
			const slot = slotRects.get(d.slot);
			if (!slot) continue;
			const sx = slot.left + slot.width / 2 - box.left;
			const pts = E.antPath(s, d);
			let j = 0;
			for (let k = 1; k < pts.length && pts[k].y === s.h; k++) {
				if (Math.abs(at(pts[k]).x - sx) < Math.abs(at(pts[j]).x - sx)) j = k;
			}
			const path = [{ x: sx, y: slot.top - box.top }, { x: sx, y: edgeY }, ...pts.slice(j).map(at)];
			const size = Math.max(3, Math.round(cellPx * 0.32));
			// Arrive on the clock's next gear line, so every arrival sounds on the beat.
			const arrives = ctl.clock.next(lastTick + d.eta * ctl.clock.ms, ctl.clock.gear);
			ants.run(path, d.cell, arrives, s.colors[d.c].hex, size);
		}
	}

	function runTick() {
		const s = game;
		if (!s || ctl.overlay || ctl.won) return;
		const r = E.tick(s);
		if (r.dispatched.length) {
			ctl.touch();
			launch(r.dispatched);
		}
		if (r.eaten.length) {
			ctl.touch();
			if (ctl.still) ctl.music?.note(s.colors[r.eaten[0].c].hex);
			if (r.unlocked.length) {
				ctl.say(`Column ${r.unlocked.map((k) => k + 1).join(' and ')} opened.`);
				ctl.music?.chime();
			}
			for (const c of new Set(r.eaten.map((e) => e.c))) checkFinished(c);
			if (r.won) settle();
		} else {
			settle();
		}
	}

	function settle() {
		if (!ants?.bound.size) ctl.settle();
	}

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
		let start = performance.now();
		let pace = ctl.clock.ms;
		let timer = 0;
		const loop = () => {
			const now = performance.now();
			if (ctl.clock.ms !== pace) {
				start = lastTick;
				pace = ctl.clock.ms;
			}
			// Time each tick from the first at this tempo, so ticks never drift.
			lastTick = start + Math.round((now - start) / pace) * pace;
			runTick();
			timer = window.setTimeout(loop, lastTick + pace - performance.now());
		};
		lastTick = start;
		timer = window.setTimeout(loop, pace);
		return () => {
			unmount();
			clearTimeout(timer);
			ants?.clear();
		};
	});
</script>

<svelte:document onkeydown={ctl.onKey} />

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
	<GameBar {...ctl.bar} game="forage" {difficulty} />

	<p class="sr-only" aria-live="polite">{ctl.status}</p>

	{#if game && board && view}
		<div
			class="stage"
			class:won={ctl.won}
			bind:this={stageEl}
			style:--n={view.slots.length}
			style:--lane-gap="{GAP}px"
			style:--cols={columnItems.length}
		>
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
								{@const dispenser = c === E.DISPENSER ? view.dispensers.get(i) : undefined}
								{#if dispenser && view.alive[i]}
									<div
										class="px dispenser"
										style:--c={game.colors[dispenser.c].hex}
										style:--ink={inkOn(game.colors[dispenser.c].hex)}
										title="Dispenser: {dispenser.left} more of this color"
									>
										<span class="dispense">{dispenser.left}</span>
									</div>
								{:else if c === E.DISPENSER}
									<div class="px" class:sealed={!board.out[i]}></div>
								{:else if view.alive[i]}
									<div class="px food" data-i={i} style:--c={game.colors[c].hex}>
										{#if i in board.keys}
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
													: 'Working'}: {colonyLabel(e)}"
										>
											<span class="count">{done ? '✓' : e.n > 0 ? e.n : ''}</span>
										</div>
									{/if}
								</div>
							{/each}
							{@render railBars(links.slots)}
						</div>
						<div class="lanes-area">
							<div class="lanes" class:hidden={!!ctl.overlay}>
								{#each columnItems as items, k (k)}
									{@const head = items[0]}
									<button
										class="lane"
										class:flash={flashCol.value === k}
										disabled={!head}
										aria-label="Column {k + 1}: {!head
											? 'empty'
											: head.kind === 'lock'
												? 'locked until its key in the picture touches the outside'
												: colonyLabel(head.e)}{items.length > 1
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
										{#if items.length > VISIBLE}
											<span class="more">
												{#if links.late[k]}
													<span class="late" class:crowded={links.late[k].length > 4}>
														{#each links.late[k] as r (r.g)}
															<span
																class="late-ring"
																class:flash={flashGroup.value === r.g}
																style:--g={r.color}
															></span>
														{/each}
													</span>
												{/if}
												<span class="left">+{items.length - VISIBLE}</span>
											</span>
										{/if}
									</button>
								{/each}
								{@render railBars(links.lanes)}
							</div>
							{#if ctl.overlay}
								<LevelEnd
									{...ctl.end}
									text={ctl.overlay === 'win'
										? ctl.wonText('cleared')
										: 'every slot is busy and no colony at the front can finish'}
								/>
							{/if}
						</div>
					</div>
				</Card>
				<LevelNav {...ctl.nav} />
			</div>
			<div
				class="ant-layer"
				{@attach (node) => {
					ants = new AntLayer(node, arrived, () => BEAT_TICKS * ctl.clock.ms);
				}}
				aria-hidden="true"
			></div>
		</div>
	{/if}
</div>

<style>
	.forage {
		container-type: inline-size;
		--gap: 2px;
		--room-w: calc(min(100cqw, 640px) - 40px);
		/* svh stays steady while a phone's address bar comes and goes. */
		--room-h: max(50svh, 180px);
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
		--picture-w: calc((var(--w) + 2) * var(--pitch) + var(--gap) + 2 * var(--border-size));
		/* size() in marks.ts assumes these two sizes. */
		--slot-size: 52px;
		--colony: 36px;
		--muted: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
		--hole: color-mix(in srgb, var(--text-color) 18%, var(--primary-color));

		box-sizing: border-box;
		width: 100%;
		/* The page can center on half a pixel, so the game centers itself with whole-pixel padding. */
		padding-inline: max(0px, round(down, calc((100% - 720px) / 2), 1px));
		/* Quick taps are moves, so a double tap must not zoom. */
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

	.stage {
		--lane-pitch: calc(var(--slot-size) + var(--lane-gap));
		--lane-foot: 24px;
		--pad: calc((var(--slot-size) - var(--colony)) / 2);
		--slots-w: calc(var(--n) * var(--slot-size) + (var(--n) - 1) * var(--lane-gap));
		--lanes-w: calc(var(--cols) * var(--slot-size) + (var(--cols) - 1) * var(--lane-gap));
		--tab-pad: 14px;
		--tab-edges: calc(2 * (var(--tab-pad) + var(--border-size)));
		--tab-w: calc(max(var(--slots-w), var(--lanes-w)) + var(--tab-edges));
		--board-w: min(100cqw, max(var(--picture-w), var(--tab-w)));
		position: relative;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-top: 4px;
	}
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
	.food {
		background: var(--c);
		border-radius: 2px;
		box-shadow: inset 0 0 0 1px rgb(0 0 0 / 0.12);
	}
	.sealed {
		background: var(--hole);
		border-radius: 2px;
	}
	.dispenser {
		display: grid;
		place-items: center;
		background: var(--c);
		border-radius: 2px;
		box-shadow: inset 0 0 0 max(1px, round(down, calc(var(--cell) / 8), 1px)) var(--text-color);
	}
	.dispense {
		font-family: Courier, monospace;
		font-weight: 700;
		font-size: max(7px, round(down, calc(var(--cell) * 0.6), 1px));
		line-height: 1;
		color: var(--ink);
	}
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

	.tab {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: var(--lane-gap);
		padding: 8px var(--tab-pad);
	}
	.slots {
		--row-w: var(--slots-w);
		display: flex;
		gap: var(--lane-gap);
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
		background: var(--primary-color);
		box-shadow: var(--inset);
		display: grid;
		place-items: center;
	}

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
		gap: var(--lane-gap);
	}
	.lane {
		position: relative;
		z-index: 0;
		box-sizing: border-box;
		width: var(--slot-size);
		height: calc(var(--slot-size) * 3 + var(--lane-foot));
		padding: var(--pad) 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(2 * var(--pad));
		border: 0;
		border-radius: 10px;
		background: var(--primary-color);
		box-shadow: var(--inset);
		color: var(--text-color);
		cursor: pointer;
	}
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
	.count {
		color: var(--ink);
		font: inherit;
	}
	.colony.front {
		--ring: inset 0 0 0 2px var(--text-color), inset 0 -5px 0 rgb(0 0 0 / 0.22);
		padding-bottom: 3px;
	}
	.colony.linked {
		box-shadow:
			var(--ring),
			0 0 0 calc(var(--pad) / 2 - 2px) var(--primary-color),
			0 0 0 calc(var(--pad) / 2) var(--g);
	}
	.colony.flash {
		box-shadow:
			var(--ring),
			0 0 0 3px var(--accent-color);
	}
	.lock {
		position: relative;
		flex: none;
		width: var(--colony);
		height: var(--colony);
		border-radius: 10px;
		display: grid;
		place-items: center;
		color: var(--text-color);
		background: var(--primary-color);
		box-shadow: inset 0 0 0 3px var(--m);
	}
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
	.more {
		position: absolute;
		bottom: 2px;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		line-height: 12px;
		font-family: Courier, monospace;
		font-size: 12px;
		color: var(--muted);
	}
	.left {
		font: inherit;
		color: inherit;
	}
	.late {
		display: flex;
		gap: 2px;
	}
	.late.crowded {
		gap: 0;
	}
	.late.crowded .late-ring + .late-ring {
		margin-left: -2px;
	}
	.late-ring {
		box-sizing: border-box;
		width: 8px;
		height: 8px;
		border: 2px solid var(--g);
		border-radius: 50%;
	}
	.late-ring.flash {
		box-shadow: 0 0 0 2px var(--accent-color);
	}

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
