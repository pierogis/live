<!--
	Forage: tap the front colony of a column; its ants eat exposed blocks of their color.
	The engine mutates the state in place, so `version` is bumped after each change and
	everything derived from the state reads it.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';

	import * as E from './engine';
	import type { Colony, Level, State } from './engine';
	import { difficultyIndex } from '../shared/difficulty';
	import { loadSave, persist, type Save } from './save';
	import { blank } from '../shared/save';
	import LevelEnd from '../shared/game/LevelEnd.svelte';
	import GameBar from '../shared/game/GameBar.svelte';
	import { blip } from '../shared/sound';
	import { AntLayer } from './ants';
	import '../shared/game/joined.css';

	interface Props {
		levels: Level[];
		start?: number;
		/** Play without reading or writing saved progress. */
		sandbox?: boolean;
		/** Where the list of all pictures lives; omit to hide the link. */
		picturesHref?: string;
		/** Each level's own page. When given, moving to another level navigates there. */
		levelHref?: (index: number) => string;
		/** On a page without a level in its URL: go to the saved level once it's known. */
		resume?: boolean;
	}

	let { levels, start, sandbox = false, picturesHref, levelHref, resume = false }: Props = $props();

	const VISIBLE = 3;

	let save: Save = $state(blank());
	let levelIndex = $state(0);
	let levelKey = $state(0);
	let game: State | null = $state.raw(null);
	let version = $state(0);
	let initial: State | null = null;
	let history: State[] = [];
	let historyLen = $state(0);
	/** Read out to screen readers only; the game shows what happens instead of narrating it. */
	let status = $state('');
	/** Brief visual cues for a tap that can't go. */
	let flashId = $state(-1);
	let flashKey = $state(-1);
	let flashCol = $state(-1);
	let slotsFlash = $state(false);
	let overlay: 'win' | 'stuck' | null = $state(null);
	let winText = $state('');
	let won = $state(false);
	let reduceMotion: MediaQueryList | null = null;
	let rootEl: HTMLElement | undefined = $state();

	const level = $derived(levels[levelIndex]);
	const title = $derived(level ? `${levelIndex + 1} / ${levels.length} · ${level.name}` : '');
	const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

	function keep() {
		if (!sandbox) persist(save);
	}

	function sound(i: number, soft = false) {
		if (!save.muted) blip(i, soft);
	}

	function say(msg: string) {
		status = msg;
	}

	/** Mark something for a moment: a still outline, no motion. */
	const cueTimers: ReturnType<typeof setTimeout>[] = [];
	function cue(set: (on: boolean) => void, ms = 900) {
		set(true);
		cueTimers.push(setTimeout(() => set(false), ms));
	}

	/** Black or white text, whichever reads better on `hex`. */
	function inkOn(hex: string) {
		const n = parseInt(hex.slice(1), 16);
		const lum = 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
		return lum > 150 ? '#1b1b24' : '#ffffff';
	}

	// ---------- what to draw ----------
	/** The parts of the state the template shows, read through `version` so moves redraw them. */
	const view = $derived.by(() => {
		void version;
		if (!game) return null;
		return {
			alive: game.alive.slice(),
			slots: game.slots.slice(),
			columns: game.columns.map((col) => col.slice()),
			left: E.blocksLeft(game)
		};
	});

	const board = $derived.by(() => {
		void version;
		const s = game;
		if (!s) return null;
		const out = E.outside(s);
		const keys: Record<number, number> = {};
		s.locks.forEach((cell, k) => {
			if (cell >= 0 && E.hasLock(s, k)) keys[cell] = k;
		});
		// Working colonies with nothing of their color to reach are just waiting.
		const hungry = s.slots.map((e) => !!e && E.isWaiting(s, e));
		return { out, keys, hungry };
	});

	type Item = { kind: 'colony'; e: Colony; front: boolean } | { kind: 'lock'; key: number };
	/** Each column top to bottom, with its lock in front of the colony it blocks. */
	const columnItems = $derived.by(() => {
		void version;
		if (!game) return [];
		return game.columns.map((col, k) => {
			const items: Item[] = col.map((e) => ({ kind: 'colony', e, front: false }));
			if (E.hasLock(game!, k)) items.splice(game!.lockAt[k], 0, { kind: 'lock', key: k });
			if (items[0]?.kind === 'colony') items[0].front = true;
			return items;
		});
	});

	const levelDifficulty = (lv: Level) => difficultyIndex(lv.wins);

	/** Linked pairs get a letter so you can match them up. */
	const linkLetter = $derived.by(() => {
		void version;
		const letters: Record<number, string> = {};
		if (!game) return letters;
		let n = 0;
		for (const col of [game.slots.filter((e): e is Colony => !!e), ...game.columns]) {
			for (const e of col) {
				if (e.link === undefined || e.id in letters) continue;
				letters[e.id] = letters[e.link] = 'ABCDEFGH'[n++ % 8];
			}
		}
		return letters;
	});

	function colonyLabel(e: Colony, front: boolean) {
		if (e.mystery && !front) return 'Mystery colony';
		const name = game!.colors[e.c].key;
		return `${name} colony, ${plural(e.n, 'ant', 'ants')}${e.link !== undefined ? ', linked' : ''}`;
	}

	// ---------- level setup ----------
	/**
	 * Set up level i. No saving and no page access, so it also runs on the server:
	 * the page arrives with its picture and colonies already drawn.
	 */
	function buildLevel(i: number) {
		overlay = null;
		levelIndex = i;
		game = E.buildPuzzle(levels[i], i);
		initial = E.clone(game);
		history = [];
		historyLen = 0;
		won = false;
		levelKey++;
		version++;
		ants?.clear();
		say(`${levels[i].name}.`);
	}

	function startLevel(i: number) {
		buildLevel(i);
		save.level = i;
		keep();
	}

	/** Another level: its own page when there is one, else in place. */
	function goLevel(i: number) {
		if (levelHref) goto(levelHref(i));
		else startLevel(i);
	}

	// Moving between level pages reuses this component with a new `start`.
	$effect(() => {
		const next = start;
		untrack(() => {
			if (next !== undefined && next !== levelIndex) startLevel(next);
		});
	});

	// ---------- moves ----------
	/** One step of time. Ants walk a tick at a time; each colony sends one every E.DISPATCH_EVERY ticks. */
	const TICK_MS = 100;

	function send(col: number) {
		const s = game;
		if (!s || overlay || E.isWon(s)) return;
		const before = E.clone(s);
		const r = E.send(s, col);
		if (!r.ok) {
			explain(r.reason, col);
			sound(0, true);
			return;
		}
		history.push(before);
		if (history.length > 300) history.shift();
		historyLen = history.length;
		stuckShown = false;
		version++;
		sound(6);
		launch(r.dispatched);
	}

	let stageEl: HTMLElement | undefined = $state();
	let antLayer: HTMLElement | undefined = $state();
	let ants: AntLayer | null = null;
	$effect(() => {
		if (antLayer) ants = new AntLayer(antLayer);
	});

	let pictureEl: HTMLElement | undefined = $state();
	/**
	 * Ants leave their slot and walk the path the engine found: up out of the slot
	 * into the picture's margin, along it and in through cleared space to the food.
	 * The engine starts each path at its slot's door on the bottom edge; the walk
	 * along that edge is cut to start above the slot, where the ant comes out.
	 */
	function launch(list: E.Dispatch[]) {
		const s = game;
		if (!ants || !stageEl || !pictureEl || !s || reduceMotion?.matches) return;
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
		for (const d of list) {
			const slot = stageEl.querySelector(`[data-slot="${d.slot}"]`)?.getBoundingClientRect();
			if (!slot) continue;
			const sx = slot.left + slot.width / 2 - box.left;
			const pts = E.antPath(s, d.slot, d.cell);
			// Join the path at its bottom-edge point nearest the slot.
			let j = 0;
			for (let k = 1; k < pts.length && pts[k].y === s.h; k++) {
				if (Math.abs(at(pts[k]).x - sx) < Math.abs(at(pts[j]).x - sx)) j = k;
			}
			const path = [{ x: sx, y: slot.top - box.top }, { x: sx, y: edgeY }, ...pts.slice(j).map(at)];
			ants.run(path, d.eta * TICK_MS, s.colors[d.c].hex, Math.max(3, Math.round(cellPx * 0.32)));
		}
	}

	let stuckShown = false;
	let tickCount = 0;
	/** One step of time: working colonies eat. Paused while a menu is open or the picture is done. */
	function runTick() {
		const s = game;
		if (!s || overlay || won) return;
		const r = E.tick(s);
		if (r.dispatched.length) {
			version++;
			launch(r.dispatched);
		}
		if (r.eaten.length) {
			version++;
			if (tickCount++ % 2 === 0) sound(r.eaten.length + tickCount / 2, true);
			if (r.unlocked.length) {
				say(`Column ${r.unlocked.map((k) => k + 1).join(' and ')} opened.`);
				sound(9);
			}
			if (r.won) win();
		} else if (!stuckShown && E.isStuck(s)) {
			stuckShown = true;
			setTimeout(() => game === s && E.isStuck(s) && (overlay = 'stuck'), 400);
		}
	}

	/** A tap that can't go: show why with a quick cue, not a message. */
	function explain(reason: string, col: number) {
		if (reason === 'locked') {
			cue((on) => (flashCol = on ? col : -1));
			cue((on) => (flashKey = on ? col : -1));
			say(`Column ${col + 1} is locked until its key is uncovered.`);
		} else if (reason === 'partner') {
			const link = game?.columns[col][0]?.link ?? -1;
			cue((on) => (flashId = on ? link : -1));
			say('Linked: its partner has to be at the front too.');
		} else if (reason === 'no-slot') {
			cue((on) => (slotsFlash = on));
			say('Every slot is busy.');
		}
	}

	function win() {
		const lv = levels[levelIndex];
		save.completed[lv.id] = true;
		keep();
		won = true;
		say('Picture cleared.');
		setTimeout(() => {
			if (!game || !E.isWon(game)) return;
			winText = `${lv.name}, cleared in ${plural(game.moves, 'move', 'moves')}.`;
			overlay = 'win';
		}, 1100);
	}

	function undo() {
		if (!history.length || (overlay && overlay !== 'stuck')) return;
		overlay = null;
		game = history.pop()!;
		historyLen = history.length;
		won = false;
		stuckShown = false;
		ants?.clear();
		version++;
		say('Undone.');
	}

	function restart() {
		if (!game || !initial || overlay) return;
		if (game.moves > 0) {
			history.push(game);
			historyLen = history.length;
		}
		game = E.clone(initial);
		won = false;
		stuckShown = false;
		ants?.clear();
		version++;
		say('Started over.');
	}

	function toggleSound() {
		save.muted = !save.muted;
		keep();
		if (!save.muted) blip(4);
	}

	function onKey(e: KeyboardEvent) {
		if ((e.target as Element).closest?.('input, textarea, select')) return;
		if (e.metaKey || e.ctrlKey || e.altKey) {
			if (e.key.toLowerCase() === 'z' && !e.altKey) {
				e.preventDefault();
				undo();
			}
			return;
		}
		const key = e.key.toLowerCase();
		const n = Number(e.key);
		if (game && n >= 1 && n <= game.columns.length) send(n - 1);
		else if (key === 'z') undo();
		else if (key === 'r') restart();
	}

	// The page's own level, built right away (on the server too). Later changes to
	// `start` come through the effect above.
	untrack(() => {
		if (start !== undefined) buildLevel(Math.min(Math.max(0, start), levels.length - 1));
	});

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (!sandbox) save = loadSave();
		const saved = Math.min(Math.max(0, save.level | 0), levels.length - 1);
		if (resume && levelHref && saved !== levelIndex) {
			goto(levelHref(saved), { replace: true });
		} else if (start === undefined) {
			startLevel(saved);
		} else {
			// The page's level was built already (also on the server); remember it.
			save.level = levelIndex;
			keep();
		}
		const clock = setInterval(runTick, TICK_MS);
		return () => {
			clearInterval(clock);
			cueTimers.forEach(clearTimeout);
			ants?.clear();
		};
	});
</script>

<svelte:document onkeydown={onKey} />

<div class="forage" bind:this={rootEl} style:--w={game?.w ?? 1} style:--h={game?.h ?? 1}>
	<GameBar
		game="forage"
		label={title}
		difficulty={level ? levelDifficulty(level) : null}
		canUndo={historyLen > 0}
		muted={save.muted}
		{picturesHref}
		onundo={undo}
		onrestart={restart}
		onsound={toggleSound}
	/>

	<p class="sr-only" aria-live="polite">{status}</p>

	{#if game && board && view}
		<div
			class="stage"
			class:won
			bind:this={stageEl}
			style:--n={view.slots.length}
			style:--cols={columnItems.length}
		>
			{#key levelKey}
				<div
					class="picture joined-top"
					bind:this={pictureEl}
					role="img"
					aria-label="{level.name}: {view.left} food left"
				>
					{#each game.target as c, i (i)}
						{#if view.alive[i]}
							<div class="px food" data-i={i} style:--c={game.colors[c].hex}>
								{#if i in board.keys}
									<span
										class="key"
										class:flash={flashKey === board.keys[i]}
										title="Key for column {board.keys[i] + 1}">{board.keys[i] + 1}</span
									>
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

			<div class="ant-layer" bind:this={antLayer} aria-hidden="true"></div>
			<!-- One tab under the picture: the working slots, then the colonies' lanes. -->
			<div class="tab joined-tab">
				<div class="slots" class:flash={slotsFlash} aria-label="Working slots">
					{#each view.slots as e, k (k)}
						<div class="slot" data-slot={k}>
							{#if e}
								{@const done = E.isDone(e)}
								<div
									class="colony"
									class:waiting={board.hungry[k]}
									class:flash={flashId === e.id}
									style:--c={game.colors[e.c].hex}
									style:--ink={inkOn(game.colors[e.c].hex)}
									aria-label="{done
										? 'Done, waiting for its linked partner'
										: board.hungry[k]
											? 'Waiting'
											: 'Working'}: {colonyLabel(e, true)}"
								>
									<!-- Counts down as its ants leave. -->
									<span class="count">{done ? '✓' : e.n > 0 ? e.n : ''}</span>
									{#if e.link !== undefined}<span class="link-badge">{linkLetter[e.id]}</span>{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
				<!-- The end panel takes the lanes' place, so nothing on the page moves. -->
				<div class="lanes-area">
					<div class="lanes" class:hidden={!!overlay}>
						{#each columnItems as items, k (k)}
							{@const head = items[0]}
							<!-- A lane is one button: tapping it sends the colony at its front. -->
							<button
								class="lane"
								class:flash={flashCol === k}
								disabled={!head}
								aria-label="Column {k + 1}: {!head
									? 'empty'
									: head.kind === 'lock'
										? `locked until key ${k + 1} in the picture touches the outside`
										: colonyLabel(head.e, true)}{items.length > 1
									? `, ${items.length - 1} more`
									: ''}"
								onclick={() => send(k)}
							>
								{#each items.slice(0, VISIBLE) as item (item.kind === 'lock' ? 'lock' : item.e.id)}
									{#if item.kind === 'lock'}
										<span
											class="lock"
											class:behind={head !== item}
											title="Locked until key {k + 1} in the picture touches the outside"
										>
											<svg viewBox="0 0 24 24"
												><rect x="5" y="11" width="14" height="10" rx="2" /><path
													d="M8 11V7a4 4 0 0 1 8 0v4"
												/></svg
											>
											<span class="key-badge">{k + 1}</span>
										</span>
									{:else}
										{@const e = item.e}
										{@const hidden = !item.front && !!e.mystery}
										<span
											class="colony"
											class:behind={!item.front}
											class:flash={flashId === e.id}
											style:--c={hidden ? 'var(--hole)' : game.colors[e.c].hex}
											style:--ink={hidden ? 'var(--text-color)' : inkOn(game.colors[e.c].hex)}
										>
											<span class="count">{hidden ? '?' : e.n}</span>
											{#if e.link !== undefined}<span class="link-badge">{linkLetter[e.id]}</span
												>{/if}
										</span>
									{/if}
								{/each}
								{#if items.length > VISIBLE}<span class="more">+{items.length - VISIBLE}</span>{/if}
							</button>
						{/each}
					</div>
					{#if overlay}
						<LevelEnd
							plain
							state={overlay === 'win' ? 'won' : 'stuck'}
							text={overlay === 'win'
								? winText
								: 'every slot is busy and no colony at the front can finish'}
							nextHref={levelHref?.((levelIndex + 1) % levels.length)}
							onnext={() => goLevel((levelIndex + 1) % levels.length)}
							{picturesHref}
							onundo={undo}
							onrestart={() => {
								overlay = null;
								restart();
							}}
						/>
					{/if}
				</div>
			</div>
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
		/* The picture with its walking ring: (w + 2) cells and (w + 3) gaps. */
		--picture-w: calc((var(--w) + 2) * var(--pitch) + var(--gap));
		--slot-size: 44px;
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
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
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
	 * The picture and the slots are one piece (see joined.css), so the ants walk out
	 * of their slot straight into the picture's margin. The picture is at least
	 * wide enough for the slots' tab and the curves beside it.
	 */
	.stage {
		/* Slots and lanes share one pitch, so a colony is the same size in both. */
		--slots-w: calc(var(--n) * var(--slot-size) + (var(--n) - 1) * 8px);
		--lanes-w: calc(var(--cols) * var(--slot-size) + (var(--cols) - 1) * 8px);
		--tab-w: calc(max(var(--slots-w), var(--lanes-w)) + 20px);
		--board-w: min(100cqw, max(var(--picture-w), calc(var(--tab-w) + 48px)));
		position: relative;
		align-self: stretch;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		margin-top: 4px;
	}
	.stage.won {
		--edge: var(--secondary-color);
	}
	.picture,
	.tab {
		margin-left: max(0px, round(down, calc((100cqw - var(--snap-w)) / 2), 1px));
	}
	/* Inside the tab, the slots and the lanes are each centered on whole pixels. */
	.slots,
	.lanes {
		margin-left: round(down, calc((var(--tab-w) - 20px - var(--row-w)) / 2), 1px);
	}
	.picture {
		--snap-w: var(--board-w);
		--ring: calc(var(--cell) + var(--gap) * 2);
		box-sizing: border-box;
		width: var(--board-w);
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
	.key {
		position: absolute;
		inset: -1px;
		display: grid;
		place-items: center;
		border-radius: 50%;
		background: var(--primary-color);
		color: var(--text-color);
		font-family: Courier, monospace;
		font-size: max(8px, calc(var(--cell) * 0.6));
		font-weight: 700;
		box-shadow: 0 0 0 2px var(--text-color);
		z-index: 2;
	}
	.key.flash {
		box-shadow: 0 0 0 3px var(--accent-color);
	}

	.ant-layer {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 20;
	}
	/* An ant is a pixel of its food's color; carrying, it gets a second ring. */
	.ant-layer :global(.ant) {
		position: absolute;
		width: var(--size);
		height: var(--size);
		margin: calc(var(--size) / -2) 0 0 calc(var(--size) / -2);
		background: var(--crumb);
		box-shadow: 0 0 0 1px var(--primary-color);
		will-change: transform;
	}
	.ant-layer :global(.ant.carrying) {
		background: var(--crumb);
		box-shadow:
			0 0 0 1px var(--text-color),
			0 0 0 2px var(--primary-color);
	}

	/* The tab: working slots on top, the colonies' lanes under them. */
	.tab {
		--snap-w: var(--tab-w);
		width: var(--tab-w);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
		padding: 8px;
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
		padding: calc((var(--slot-size) - var(--colony)) / 2) 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: calc(var(--slot-size) - var(--colony));
		border: 0;
		border-radius: 10px;
		background: var(--well);
		box-shadow: var(--inset);
		color: var(--text-color);
		cursor: pointer;
	}
	/* The site's hover ring, on the whole lane. */
	.lane::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: 10px;
		opacity: 0;
		box-shadow: var(--shadow);
		transform: scale(0.92);
		transition: all 200ms;
	}
	.lane:not(:disabled):hover::before,
	.lane:focus-visible::before {
		opacity: 1;
		transform: scale(1.04);
	}
	.lane:not(:disabled):active {
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
		box-shadow: var(--inset);
		font-family: Courier, monospace;
		font-weight: 700;
		font-size: 14px;
	}
	.colony.flash {
		box-shadow:
			var(--inset),
			0 0 0 3px var(--accent-color);
	}
	/* Behind the front, waiting their turn: there, but not what a tap sends. */
	.colony.behind,
	.lock.behind {
		opacity: 0.4;
	}
	/* A working colony with nothing it can reach is just waiting. */
	.colony.waiting {
		opacity: 0.45;
	}
	.count {
		color: var(--ink);
		font-family: Courier, monospace;
	}
	.link-badge {
		position: absolute;
		top: -6px;
		right: -6px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary-color);
		color: var(--text-color);
		font-family: Courier, monospace;
		font-size: 11px;
		font-weight: 700;
		display: grid;
		place-items: center;
		box-shadow: 0 0 0 2px var(--text-color);
	}
	/* A lock sits in the lane in front of the colonies it holds back. */
	.lock {
		position: relative;
		flex: none;
		box-sizing: border-box;
		width: var(--colony);
		height: var(--colony);
		border-radius: 10px;
		display: grid;
		place-items: center;
		border: 2px dashed var(--text-color);
		color: var(--text-color);
	}
	.key-badge {
		position: absolute;
		right: -7px;
		top: -7px;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: var(--primary-color);
		color: var(--text-color);
		display: grid;
		place-items: center;
		font-family: Courier, monospace;
		font-size: 11px;
		font-weight: 700;
		box-shadow: 0 0 0 2px var(--text-color);
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

	/* The lanes give way to the level end, keeping their room. */
	.hidden {
		visibility: hidden;
	}
	@media (max-width: 420px) {
		.forage {
			--slot-size: 40px;
			--colony: 32px;
		}
	}
	@media (max-width: 500px) {
		/* Phones: the picture takes the full width (the page scrolls if the colonies end up below). */
		.forage {
			--gap: 1px;
			--room-w: calc(100cqw - 8px);
			--pitch: round(down, clamp(8px, calc(var(--room-w) / (var(--w) + 2)), 24px), 1px);
		}
		:global(body .content:has(> .forage)) {
			padding-left: 6px;
			padding-right: 6px;
		}
	}
</style>
