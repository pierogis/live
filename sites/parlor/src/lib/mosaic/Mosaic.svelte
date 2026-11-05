<!--
	Mosaic: renders the engine state, handles the two-tap moves, zoom and pan, and animates.
	The engine state is mutated in place by the engine, so `version` is bumped after each
	change and everything derived from the state reads it.
-->
<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Attachment } from 'svelte/attachments';

	import * as E from './engine';
	import type { Dst, Level, MoveResult, Sel, State } from './engine';
	import LevelEnd from '../shared/game/LevelEnd.svelte';
	import GameBar from '../shared/game/GameBar.svelte';
	import '../shared/game/joined.css';
	import { loadSave, persist, type Save } from './save';
	import { blank } from '../shared/save';
	import { Flights, snapshotRects } from './flights';
	import { blip } from '../shared/sound';

	interface Props {
		levels: Level[];
		/** Start on this level instead of the saved one. */
		start?: number;
		/** Play without reading or writing saved progress, e.g. to play-test a draft. */
		sandbox?: boolean;
		/** Where the list of all pictures lives; omit to hide the link. */
		picturesHref?: string;
		/** Each level's own page. When given, moving to another level navigates there. */
		levelHref?: (index: number) => string;
		/** On a page without a level in its URL: go to the saved level once it's known. */
		resume?: boolean;
	}

	let { levels, start, sandbox = false, picturesHref, levelHref, resume = false }: Props = $props();

	const STAGGER = 40;
	/** Whether the last tap was a finger, which gets a wider reach than a mouse. */
	let touchTap = false;
	const MAX_ZOOM = 4;

	let save: Save = $state(blank());
	let levelIndex = $state(0);
	/** Bumps on each new level, so the board is rebuilt rather than reused. */
	let levelKey = $state(0);
	let game: State | null = $state.raw(null);
	let version = $state(0);
	let initial: State | null = null;
	let history: State[] = [];
	let historyLen = $state(0);
	let sel: Sel | null = $state.raw(null);
	let hoverCell = $state(-1);
	let trayHover: { color: number } | { slot: true } | null = $state(null);
	let focusCell = $state(-1);
	/** Read out to screen readers only; the game shows what happens instead of narrating it. */
	let status = $state('');
	let overlay: 'win' | 'stuck' | null = $state(null);
	let won = $state(false);
	/** A still outline on the tray for a moment, when a move doesn't fit. */
	let trayFlash = $state(false);
	let trayTimer: ReturnType<typeof setTimeout> | undefined;
	let winText = $state('');

	const pendingCells = new SvelteSet<number>();
	const pendingTray = new SvelteSet<number>();
	const flights = new Flights();

	let rootEl: HTMLElement | undefined = $state();
	let viewEl: HTMLElement | undefined = $state();
	let boardEl: HTMLElement | undefined = $state();
	let trayEl: HTMLElement | undefined = $state();
	let fxEl: HTMLElement | undefined = $state();
	let reduceMotion: MediaQueryList | null = null;

	/**
	 * Zooming makes the cells bigger rather than scaling the board, so every size
	 * and offset stays a whole pixel. `cell` is the zoomed cell size (0 = fit);
	 * `scale` is how many times the fitted size that is.
	 */
	let zoom = $state({ cell: 0, scale: 1, tx: 0, ty: 0 });
	const zoomed = $derived(zoom.cell > 0);

	const level = $derived(levels[levelIndex]);
	const title = $derived(
		level
			? `${levelIndex + 1} / ${levels.length} · ${level.name}${save.relaxed ? ' · Relaxed' : ''}`
			: ''
	);
	function keep() {
		if (!sandbox) persist(save);
	}

	const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

	// ---------- selection ----------
	/** Board picks are held "in hand" as an exact set of dots. */
	function pickBoard(cell: number): Sel {
		return { from: 'board', cell, cells: E.groupAt(game!, cell)!.cells };
	}

	function selColor(): number {
		if (!sel || !game) return -1;
		if (sel.from === 'tray') return sel.color;
		return game.top[sel.cell]?.c ?? -1;
	}

	function selSize(): number {
		return (game && E.selectionDots(game, sel)?.length) || 0;
	}

	const picked = $derived.by(() => {
		void version;
		if (!game || sel?.from !== 'board') return new Set<number>();
		return new Set((E.selectionDots(game, sel) ?? []).map((d) => d.cell));
	});

	/** Call after anything changes the game state or the selection. */
	function sync() {
		if (game && sel) {
			const dots = E.selectionDots(game, sel);
			// Drop a selection that no longer points at anything; refresh what's in hand.
			if (!dots) sel = null;
			else if (sel.from === 'board' && sel.cells) sel = { ...sel, cells: dots.map((d) => d.cell) };
		}
		version++;
	}

	// ---------- what to draw ----------
	const boardView = $derived.by(() => {
		void version;
		const s = game;
		if (!s) return [];
		const color = selColor();
		return s.target.map((c, i) => {
			if (c < 0) return null;
			const dot = s.top[i];
			let cls: string;
			let label: string;
			if (dot) {
				cls = 'covered';
				label = 'Spot with a dot on it';
			} else if (s.filled[i] && !pendingCells.has(i)) {
				cls = 'filled';
				label = 'Filled spot';
			} else {
				cls = 'open';
				label = 'Open spot';
				if (c === color && !pendingCells.has(i)) cls += ' target';
			}
			let dotCls = picked.has(i) ? 'sel' : '';
			if (sel?.from === 'board' && sel.cell === i) dotCls += ' center';
			return {
				hex: s.colors[c].hex,
				dot,
				dotHex: dot ? s.colors[dot.c].hex : '',
				cls,
				dotCls,
				label
			};
		});
	});

	/**
	 * Hover previews:
	 *   - over a dot: outline the group a tap would pick up
	 *   - over an open spot, with dots in hand: outline its open area, and show
	 *     ghost dots on the exact spots that would fill
	 */
	const hover = $derived.by(() => {
		void version;
		const out = { hl: new Set<number>(), region: new Set<number>(), fill: new Set<number>() };
		const s = game;
		const cell = hoverCell;
		if (!s || cell < 0) return out;
		if (s.top[cell]) {
			if (picked.has(cell)) return out;
			E.groupAt(s, cell)!.cells.forEach((i) => out.hl.add(i));
			return out;
		}
		if (!sel || s.filled[cell] || s.target[cell] !== selColor()) return out;
		const region = E.openRegion(s, cell);
		const n = Math.min(region.length, selSize());
		region.forEach((i, k) => (k < n ? out.fill : out.region).add(i));
		return out;
	});

	const trayView = $derived.by(() => {
		void version;
		const s = game;
		if (!s) return [];
		const traySel = sel?.from === 'tray' ? sel.color : -1;
		const boardPick = sel?.from === 'board';
		// Hovering an empty slot with dots in hand: preview the slots they'd fill.
		const fillFrom = s.tray.length;
		const fillTo =
			trayHover && 'slot' in trayHover && boardPick
				? fillFrom + Math.min(selSize(), s.trayCap - s.tray.length)
				: fillFrom;
		const hoverColor = trayHover && 'color' in trayHover ? trayHover.color : -1;
		const out = [];
		for (let k = 0; k < s.trayCap; k++) {
			const g = s.tray[k];
			let cls = '';
			if (g && pendingTray.has(g.id)) cls = 'ghost';
			else if (g && g.c === traySel) cls = 'sel';
			if (g && g.c === hoverColor) cls += ' hl';
			const prev = s.tray[k - 1];
			out.push({
				g,
				hex: g ? s.colors[g.c].hex : '',
				cls,
				drop: !g && boardPick,
				fill: k >= fillFrom && k < fillTo,
				groupStart: k > 0 && !!prev && (!g || prev.c !== g.c)
			});
		}
		return out;
	});

	const trayState = $derived.by(() => {
		void version;
		const s = game;
		if (!s) return { used: 0, cap: 0, warn: false, nofit: false };
		const free = s.trayCap - s.tray.length;
		return {
			used: s.tray.length,
			cap: s.trayCap,
			warn: free <= 2,
			nofit: sel?.from === 'board' && free === 0
		};
	});

	// ---------- messages ----------
	function say(msg: string) {
		status = msg;
	}

	function sound(i: number, soft = false) {
		if (!save.muted) blip(i, soft);
	}

	// ---------- level setup ----------
	/**
	 * Set up level i. No saving and no page access, so it also runs on the server:
	 * the page arrives with its board already drawn.
	 */
	function buildLevel(i: number) {
		cancelFlights();
		overlay = null;
		levelIndex = i;
		game = E.buildPuzzle(levels[i], i, { relaxed: save.relaxed });
		initial = E.clone(game);
		history = [];
		historyLen = 0;
		sel = null;
		hoverCell = -1;
		won = false;
		focusCell = game.target.findIndex((c) => c >= 0);
		levelKey++;
		sync();
		say(`${levels[i].name}.`);
	}

	async function startLevel(i: number) {
		buildLevel(i);
		save.level = i;
		keep();
		await tick();
		resetZoom();
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

	/**
	 * The board's sizes as laid out. CSS sizes the board (see .stage in the styles);
	 * taps and zoom read the result here instead of keeping their own copy.
	 */
	function metrics() {
		const style = getComputedStyle(boardEl!);
		const cell = boardEl!.querySelector<HTMLElement>('.cell')?.offsetWidth ?? 0;
		const gap = parseFloat(style.columnGap) || 0;
		return {
			pad: parseFloat(style.paddingLeft) || 0,
			cell,
			gap,
			step: cell + gap,
			w: viewEl!.clientWidth,
			h: viewEl!.clientHeight
		};
	}

	// ---------- zoom and pan ----------
	/** The fitted (unzoomed) cell size, from the window, which CSS keeps at the fitted board's size. */
	function fitCell() {
		const m = metrics();
		const w = game?.w ?? 1;
		return Math.max(1, Math.round((m.w - 2 * m.pad - (w - 1) * m.gap) / w));
	}

	function resetZoom() {
		zoom = { cell: 0, scale: 1, tx: 0, ty: 0 };
	}

	/** Zoom to a `cell` size in whole pixels, panned to (tx, ty), keeping the window covered. */
	function setZoom(cell: number, tx: number, ty: number) {
		const s = game;
		if (!s || !viewEl) return resetZoom();
		const fit = fitCell();
		const c = Math.min(Math.round(fit * MAX_ZOOM), Math.round(cell));
		if (c <= fit) return resetZoom();
		const m = metrics();
		const bw = 2 * m.pad + s.w * c + (s.w - 1) * m.gap;
		const bh = 2 * m.pad + s.h * c + (s.h - 1) * m.gap;
		zoom = {
			cell: c,
			scale: c / fit,
			tx: Math.round(Math.min(0, Math.max(m.w - bw, tx))),
			ty: Math.round(Math.min(0, Math.max(m.h - bh, ty)))
		};
	}

	/** The cell size now, zoomed or not. */
	const cellNow = () => zoom.cell || fitCell();

	/**
	 * Zoom so cells are `cell` pixels, keeping the point (px, py) inside the window
	 * fixed under the finger. `from` is the zoom the point was measured in.
	 */
	function zoomTo(
		cell: number,
		px: number,
		py: number,
		from: { cell: number; tx: number; ty: number } = { cell: cellNow(), tx: zoom.tx, ty: zoom.ty }
	) {
		const m = metrics();
		// The point in cells from the board's padding edge, which stays put.
		const u = (px - from.tx - m.pad) / (from.cell + m.gap);
		const v = (py - from.ty - m.pad) / (from.cell + m.gap);
		const step = Math.round(cell) + m.gap;
		setZoom(cell, px - m.pad - u * step, py - m.pad - v * step);
	}

	/** Zoom in or out by a factor, at least one pixel per cell. */
	function zoomBy(factor: number, px: number, py: number) {
		const now = cellNow();
		let next = Math.round(now * factor);
		if (next === now) next = now + (factor > 1 ? 1 : -1);
		zoomTo(next, px, py);
	}

	function viewPoint(clientX: number, clientY: number): [number, number] {
		const r = viewEl!.getBoundingClientRect();
		return [clientX - r.left, clientY - r.top];
	}

	// Pinch to zoom (two fingers), drag to pan (one finger or mouse, when zoomed in).
	type Pt = [number, number];
	const gesture: {
		pts: Map<number, Pt>;
		moved: boolean;
		start: { mid: Pt; dist: number; cell: number; tx: number; ty: number; n: number } | null;
	} = { pts: new Map(), moved: false, start: null };
	let dragging = $state(false);

	function gestureStart() {
		const pts = Array.from(gesture.pts.values());
		const mid: Pt =
			pts.length > 1 ? [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2] : pts[0];
		const dist = pts.length > 1 ? Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) : 0;
		gesture.start = { mid, dist, cell: cellNow(), tx: zoom.tx, ty: zoom.ty, n: pts.length };
	}

	function onPointerDown(e: PointerEvent) {
		touchTap = e.pointerType !== 'mouse';
		if ((e.target as Element).closest('.zoom-ctl')) return;
		if (gesture.pts.size === 0) gesture.moved = false;
		gesture.pts.set(e.pointerId, viewPoint(e.clientX, e.clientY));
		gestureStart();
	}

	function onPointerMove(e: PointerEvent) {
		if (!gesture.pts.has(e.pointerId) || !gesture.start) return;
		gesture.pts.set(e.pointerId, viewPoint(e.clientX, e.clientY));
		const g = gesture.start;
		const pts = Array.from(gesture.pts.values());
		if (pts.length > 1 && g.n > 1) {
			// Pinch: scale by finger spread, keep the content under the fingers' midpoint.
			const mid = [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2];
			const dist = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
			// Measured from where the pinch started, so rounding never builds up.
			const cell = g.cell * (dist / Math.max(1, g.dist));
			const m = metrics();
			const u = (g.mid[0] - g.tx - m.pad) / (g.cell + m.gap);
			const v = (g.mid[1] - g.ty - m.pad) / (g.cell + m.gap);
			const step = Math.round(cell) + m.gap;
			setZoom(cell, mid[0] - m.pad - u * step, mid[1] - m.pad - v * step);
			gesture.moved = true;
		} else if (pts.length === 1 && g.n === 1) {
			const dx = pts[0][0] - g.mid[0];
			const dy = pts[0][1] - g.mid[1];
			if (!gesture.moved && Math.hypot(dx, dy) < 8) return; // still a tap
			if (!zoomed) return; // nothing to pan at full view
			gesture.moved = true;
			dragging = true;
			setZoom(zoom.cell, g.tx + dx, g.ty + dy);
		}
	}

	function onPointerEnd(e: PointerEvent) {
		if (!gesture.pts.has(e.pointerId)) return;
		gesture.pts.delete(e.pointerId);
		dragging = false;
		if (gesture.pts.size) gestureStart();
	}

	/** Trackpad pinch or Ctrl+scroll zooms; plain scrolling pans while zoomed in. */
	const wheelZoom: Attachment<HTMLElement> = (node) => {
		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const [px, py] = viewPoint(e.clientX, e.clientY);
				zoomBy(Math.exp(-e.deltaY * 0.01), px, py);
			} else if (zoomed) {
				e.preventDefault();
				setZoom(zoom.cell, zoom.tx - e.deltaX, zoom.ty - e.deltaY);
			}
		};
		node.addEventListener('wheel', onWheel, { passive: false });
		return () => node.removeEventListener('wheel', onWheel);
	};

	// ---------- forgiving taps ----------
	/** Screen-space center of cell i, accounting for zoom. */
	function cellCenter(i: number): Pt {
		const s = game!;
		const r = viewEl!.getBoundingClientRect();
		const m = metrics();
		const x = m.pad + (i % s.w) * m.step + m.cell / 2;
		const y = m.pad + Math.floor(i / s.w) * m.step + m.cell / 2;
		return [r.left + zoom.tx + x, r.top + zoom.ty + y];
	}

	/** Nearest cell to (x, y) passing `ok`, within about a fingertip; -1 if none. */
	function nearestCell(
		x: number,
		y: number,
		ok: (i: number) => boolean
	): { cell: number; d: number } | null {
		const s = game!;
		const m = metrics();
		const cellPx = m.step;
		// About a fingertip: wider for a finger than for a mouse.
		const reach = Math.max(touchTap ? 30 : 22, cellPx * (touchTap ? 0.95 : 0.75));
		const r = viewEl!.getBoundingClientRect();
		const col = Math.floor((x - r.left - zoom.tx - m.pad) / m.step);
		const row = Math.floor((y - r.top - zoom.ty - m.pad) / m.step);
		const k = Math.ceil(reach / cellPx) + 1;
		let best = -1;
		let bestD = Infinity;
		for (let dy = -k; dy <= k; dy++) {
			for (let dx = -k; dx <= k; dx++) {
				const cx = col + dx;
				const cy = row + dy;
				if (cx < 0 || cy < 0 || cx >= s.w || cy >= s.h) continue;
				const i = cy * s.w + cx;
				if (s.target[i] < 0 || !ok(i)) continue;
				const [px, py] = cellCenter(i);
				const d = Math.hypot(px - x, py - y);
				if (d <= reach && d < bestD) {
					bestD = d;
					best = i;
				}
			}
		}
		return best < 0 ? null : { cell: best, d: bestD };
	}

	/**
	 * Which cell a tap means. A direct hit on something useful wins.
	 * Otherwise snap to the nearest useful thing: with dots in hand, an open spot
	 * of their color; then any dot.
	 */
	function resolveTap(x: number, y: number, hit: number): number {
		const s = game!;
		const isDot = (i: number) => !!s.top[i];
		const isDrop = (i: number) => !!sel && !s.top[i] && !s.filled[i] && s.target[i] === selColor();
		// The useful target nearest the finger wins, not whatever cell it happened to land on.
		// Holding dots, an open spot gets a little preference over a dot beside it.
		const dot = nearestCell(x, y, isDot);
		if (sel) {
			const drop = nearestCell(x, y, isDrop);
			if (drop && (!dot || drop.d * 0.65 <= dot.d)) return drop.cell;
		}
		return dot ? dot.cell : hit;
	}

	// ---------- selecting and moving ----------
	function select(next: Sel | null) {
		sel = next;
		sync();
		if (!sel || !game) return;
		const dots = E.selectionDots(game, sel)!;
		const open = E.openCount(game, dots[0].gem.c);
		const where =
			sel.from === 'board'
				? 'an empty tray slot, or an open spot of this color'
				: 'an open spot of this color';
		say(
			`Picked up ${plural(dots.length, 'dot', 'dots')}. Tap ${where}. ${plural(open, 'spot is', 'spots are')} open for it.`
		);
	}

	async function tryMove(dst: Dst) {
		if (!sel || !game) return;
		const before = E.clone(game);
		const rects = snapshotRects([boardEl, trayEl]);
		const res = E.move(game, sel, dst);
		if (!res.ok) {
			explain(res);
			sound(0, true);
			return;
		}
		history.push(before);
		if (history.length > 500) history.shift();
		historyLen = history.length;
		res.toBoard.forEach((p) => pendingCells.add(p.cell));
		res.fromTray.forEach((p) => pendingCells.add(p.cell));
		res.toTray.forEach((p) => pendingTray.add(p.id));
		// Leftover dots stay picked up, so you can put them somewhere else.
		let keep: Sel | null = null;
		if (res.left > 0) {
			keep =
				sel.from === 'tray' ? sel : { from: 'board', cell: res.leftCell, cells: res.leftCells };
		}
		sel = keep;
		sync();
		if (keep) {
			const n = res.left;
			const where = keep.from === 'tray' ? 'in the tray' : 'picked up';
			const them = n === 1 ? 'it' : 'them';
			say(
				`${plural(n, 'dot didn’t', 'dots didn’t')} fit, so ${n === 1 ? 'it is' : 'they are'} still ${where}. Tap another spot, or tap ${them} to put ${them} down.`
			);
		}
		await tick();
		animate(res, rects);
	}

	function explain(res: MoveResult) {
		if (res.ok) return;
		if (res.reason === 'tray-full') {
			say('The tray is full.');
			bumpTray();
		} else if (res.reason === 'color') {
			say('That spot needs a different color.');
		}
	}

	function bumpTray() {
		trayFlash = true;
		clearTimeout(trayTimer);
		trayTimer = setTimeout(() => (trayFlash = false), 900);
	}

	function onCell(i: number) {
		const s = game;
		if (!s || overlay || E.isWon(s)) return;
		focusCell = i;
		if (s.top[i]) {
			// Tapping the exact dot you picked up puts it back down.
			// Tapping another dot in hand re-centers the move on it.
			// Tapping any other dot picks up its group instead.
			if (sel?.from === 'board' && sel.cell === i) select(null);
			else if (sel?.from === 'board' && picked.has(i))
				select({ from: 'board', cell: i, cells: sel.cells });
			else select(pickBoard(i));
			return;
		}
		if (s.filled[i]) {
			if (sel) select(null);
			return;
		}
		if (!sel) {
			say('Pick up some dots first, then tap this spot.');
			return;
		}
		tryMove({ to: 'spot', cell: i });
	}

	/** Tray taps: a dot picks up that dot's color; an empty slot is where picked-up dots go. */
	function onTray(e: MouseEvent) {
		const s = game;
		if (!s || overlay || E.isWon(s)) return;
		const target = e.target as Element;
		const node = target.closest<HTMLElement>('.gem[data-id]');
		if (node) {
			const gem = s.tray.find((q) => q.id === +node.dataset.id!);
			if (!gem) return;
			if (sel?.from === 'tray' && sel.color === gem.c) select(null);
			else select({ from: 'tray', color: gem.c });
			return;
		}
		if (!target.closest('.slot')) return; // the tray's padding does nothing
		if (sel?.from === 'board') tryMove({ to: 'tray' });
		else if (sel) select(null);
		else say('Pick up some dots first, then tap an empty slot.');
	}

	function onTrayHover(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || !game) return;
		const target = e.target as Element;
		const node = target.closest<HTMLElement>('.gem[data-id]');
		const gem = node && game.tray.find((q) => q.id === +node.dataset.id!);
		if (gem) trayHover = { color: gem.c };
		else if (target.closest('.slot')) trayHover = { slot: true };
		else trayHover = null;
	}

	// ---------- animation ----------
	function cellEl(i: number) {
		return boardEl?.querySelector<HTMLElement>(`[data-i="${i}"]`) ?? null;
	}

	function animate(res: MoveResult, rects: Map<number, DOMRect>) {
		if (!res.ok || !game) return;
		const colors = game.colors;
		const fly = (
			c: number,
			id: number,
			target: HTMLElement | null,
			k: number,
			onLand: () => void
		) =>
			flights.launch({
				layer: fxEl,
				hex: colors[c].hex,
				from: rects.get(id),
				target,
				delay: k * STAGGER,
				still: !!reduceMotion?.matches,
				onLand,
				onSettle: afterSettle
			});
		res.toBoard.forEach((p, k) => fly(p.c, p.id, cellEl(p.cell), k, () => landCell(p.cell, k)));
		res.toTray.forEach((p, k) => {
			const to = trayEl?.querySelector<HTMLElement>(`[data-id="${p.id}"]`) ?? null;
			fly(p.c, p.id, to, k, () => landTray(p.id, k));
		});
		res.fromTray.forEach((p, k) => fly(p.c, p.id, cellEl(p.cell), k, () => landCell(p.cell, k)));
		if (!flights.size) afterSettle();
	}

	function landCell(i: number, k: number) {
		pendingCells.delete(i);
		sound(k);
	}

	function landTray(id: number, k: number) {
		pendingTray.delete(id);
		sound(k, true);
	}

	function cancelFlights() {
		flights.cancel();
		pendingCells.clear();
		pendingTray.clear();
	}

	function afterSettle() {
		if (!game) return;
		if (E.isWon(game)) win();
		else if (E.isStuck(game)) overlay = 'stuck';
	}

	function win() {
		const lv = levels[levelIndex];
		save.completed[lv.id] = true;
		keep();
		won = true;
		say('Picture complete.');
		setTimeout(() => {
			if (!game || !E.isWon(game)) return;
			winText = `${lv.name}, finished in ${plural(game.moves, 'move', 'moves')}.`;
			overlay = 'win';
		}, 900);
	}

	// ---------- undo, restart ----------
	function undo() {
		if (!history.length || (overlay && overlay !== 'stuck')) return;
		cancelFlights();
		overlay = null;
		game = history.pop()!;
		historyLen = history.length;
		sel = null;
		won = false;
		sync();
		say('Undone.');
	}

	function restart() {
		if (!game || !initial || overlay) return;
		cancelFlights();
		if (game.moves > 0) {
			history.push(game);
			historyLen = history.length;
		}
		game = E.clone(initial);
		sel = null;
		won = false;
		sync();
		say('Started over.');
	}

	function toggleSound() {
		save.muted = !save.muted;
		keep();
		if (!save.muted) blip(4);
	}

	// ---------- events ----------
	function cellFrom(e: Event) {
		const cel = (e.target as Element).closest<HTMLElement>('.cell[data-i]');
		return cel ? +cel.dataset.i! : -1;
	}

	function onViewClick(e: MouseEvent) {
		if ((e.target as Element).closest('.zoom-ctl')) return;
		if (gesture.moved) {
			gesture.moved = false;
			return;
		}
		const hit = cellFrom(e);
		// Real pointer taps get the forgiving treatment; keyboard and synthetic clicks use the exact cell.
		const i = e.detail > 0 && game ? resolveTap(e.clientX, e.clientY, hit) : hit;
		if (i >= 0) onCell(i);
	}

	/**
	 * The cell under the pointer, worked out from where it is rather than which
	 * element it's over, so the thin gaps between cells belong to the nearest cell.
	 */
	function cellAtPoint(clientX: number, clientY: number): number {
		const s = game;
		if (!s || !viewEl) return -1;
		const r = viewEl.getBoundingClientRect();
		const m = metrics();
		const bx = clientX - r.left - zoom.tx - m.pad + m.gap / 2;
		const by = clientY - r.top - zoom.ty - m.pad + m.gap / 2;
		const col = Math.floor(bx / m.step);
		const row = Math.floor(by / m.step);
		if (col < 0 || row < 0 || col >= s.w || row >= s.h) return -1;
		const i = row * s.w + col;
		return s.target[i] >= 0 ? i : -1;
	}

	function onBoardHover(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || gesture.pts.size) return;
		const i = cellAtPoint(e.clientX, e.clientY);
		if (i !== hoverCell) hoverCell = i;
	}

	function onBoardKey(e: KeyboardEvent) {
		const s = game;
		const i = cellFrom(e);
		if (!s || i < 0) return;
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onCell(i);
			return;
		}
		const steps: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -s.w,
			ArrowDown: s.w
		};
		const step = steps[e.key];
		if (!step) return;
		e.preventDefault();
		let j = i + step;
		while (j >= 0 && j < s.target.length && s.target[j] < 0 && Math.abs(step) === s.w) j += step;
		if (Math.abs(step) === 1 && Math.floor(j / s.w) !== Math.floor(i / s.w)) return;
		if (j < 0 || j >= s.target.length || s.target[j] < 0) return;
		focusCell = j;
		cellEl(j)?.focus();
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (sel) select(null);
			return;
		}
		if ((e.target as Element).closest?.('input, textarea')) return;
		if (e.metaKey || e.ctrlKey || e.altKey) {
			if (e.key.toLowerCase() === 'z' && !e.altKey) {
				e.preventDefault();
				undo();
			}
			return;
		}
		const key = e.key.toLowerCase();
		if (key === 'z') undo();
		else if (key === 'r') restart();
		else if (key === 't' && sel?.from === 'board' && !overlay) tryMove({ to: 'tray' });
	}

	/** The board resizes itself in CSS; a zoomed-in view just keeps its edges covered. */
	function onResize() {
		if (zoomed) setZoom(zoom.cell, zoom.tx, zoom.ty);
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
			// The page's level was built already (also on the server). Relaxed mode
			// changes the tray, so rebuild for it; then remember this level.
			if (save.relaxed) buildLevel(levelIndex);
			save.level = levelIndex;
			keep();
			resetZoom();
		}
		return () => {
			cancelFlights();
			clearTimeout(trayTimer);
		};
	});
</script>

<svelte:window
	onresize={onResize}
	onpointermove={onPointerMove}
	onpointerup={onPointerEnd}
	onpointercancel={onPointerEnd}
/>
<svelte:document onkeydown={onKey} />

<div class="mosaic" bind:this={rootEl} style:--w={game?.w ?? 1} style:--h={game?.h ?? 1}>
	<GameBar
		game="mosaic"
		label={title}
		canUndo={historyLen > 0}
		muted={save.muted}
		{picturesHref}
		onundo={undo}
		onrestart={restart}
		onsound={toggleSound}
	/>

	<div class="stage" class:won>
		<p class="sr-only" aria-live="polite">{status}</p>

		<div class="board-wrap">
			<!-- Cells take Enter and Space; this handler adds forgiving taps and zoom gestures. -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="board-view joined-top"
				class:zoomed
				class:dragging
				bind:this={viewEl}
				onclick={onViewClick}
				onpointerdown={onPointerDown}
				{@attach wheelZoom}
			>
				{#key levelKey}
					<div
						class="board"
						class:won
						bind:this={boardEl}
						role="grid"
						aria-label="Picture"
						tabindex="-1"
						style:--cell={zoomed ? `${zoom.cell}px` : null}
						style:transform={zoomed ? `translate(${zoom.tx}px, ${zoom.ty}px)` : null}
						onkeydown={onBoardKey}
						onpointermove={onBoardHover}
						onpointerleave={() => (hoverCell = -1)}
					>
						{#each boardView as v, i (i)}
							{#if v}
								<div
									class="cell {v.cls}"
									class:region-hover={hover.region.has(i)}
									class:fill-preview={hover.fill.has(i)}
									data-i={i}
									role="gridcell"
									tabindex={i === focusCell ? 0 : -1}
									aria-label={v.label}
									style:--c={v.hex}
								>
									{#if v.dot}
										<div
											class="gem {v.dotCls}"
											class:hl={hover.hl.has(i)}
											data-id={v.dot.id}
											style:--c={v.dotHex}
										></div>
									{/if}
								</div>
							{:else}
								<div class="cell void"></div>
							{/if}
						{/each}
					</div>
				{/key}
			</div>

			<!-- The tray hangs under the board; a level's end panel shows in its place. -->
			<div class="tray-tab joined-tab" class:nofit={trayState.nofit || trayFlash}>
				<!-- Tray dots and slots are reached by pointer; the keyboard sends picked-up dots here with T. -->
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="tray"
					class:warn={trayState.warn}
					class:hidden={!!overlay}
					bind:this={trayEl}
					style:--n={trayView.length}
					onclick={onTray}
					onpointerover={onTrayHover}
					onpointerleave={() => (trayHover = null)}
				>
					{#each trayView as t, k (k)}
						<div
							class="slot"
							class:drop={t.drop}
							class:fill-preview={t.fill}
							class:group-start={t.groupStart}
						>
							{#if t.g}
								<div class="gem {t.cls}" data-id={t.g.id} style:--c={t.hex}></div>
							{/if}
						</div>
					{/each}
				</div>
				{#if overlay}
					<LevelEnd
						plain
						state={overlay === 'win' ? 'won' : 'stuck'}
						text={overlay === 'win' ? winText : 'no group fits in the tray or in an open spot'}
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
			<div class="under">
				<span class="count"
					>tray <b class:warn={trayState.warn}>{trayState.used} / {trayState.cap}</b></span
				>
				<div class="zoom-ctl" aria-label="Zoom">
					<button
						class="zoom-btn border inset link-box"
						aria-label="Zoom in"
						title="Zoom in"
						disabled={zoom.scale >= MAX_ZOOM - 0.05}
						onclick={() => zoomBy(1.6, metrics().w / 2, metrics().h / 2)}>+</button
					>
					<button
						class="zoom-btn border inset link-box"
						aria-label="Zoom out"
						title="Zoom out"
						disabled={!zoomed}
						onclick={() => zoomBy(1 / 1.6, metrics().w / 2, metrics().h / 2)}>&minus;</button
					>
					<button
						class="zoom-btn border inset link-box"
						aria-label="Show whole picture"
						title="Show whole picture"
						disabled={!zoomed}
						onclick={() => resetZoom()}
					>
						<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
					</button>
				</div>
			</div>
		</div>
	</div>

	<div class="fx" bind:this={fxEl} aria-hidden="true"></div>
</div>

<style>
	/* Mosaic follows the site's look: flat colors, 2px inset rings, Courier for labels. */
	.mosaic {
		--muted: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));
		--well: color-mix(in srgb, var(--text-color) 7%, var(--primary-color));
		--slotbg: color-mix(in srgb, var(--text-color) 12%, var(--primary-color));
		--silhouette: color-mix(in srgb, var(--text-color) 22%, var(--primary-color));
		--gem: 30px;

		/*
		 * The page centers its content, which can land on half a pixel. So the game
		 * spans the content and centers itself with whole-pixel padding; everything
		 * inside sits on whole pixels too (see --snap below).
		 */
		box-sizing: border-box;
		width: 100%;
		padding-inline: max(0px, round(down, calc((100% - 1200px) / 2), 1px));
		/* Quick taps are moves, so a double tap shouldn't zoom the page. Pinch still does. */
		touch-action: manipulation;
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

	/* Bar */
	.bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 0 10px;
	}
	.titles {
		flex: 1;
		min-width: 0;
	}
	.brand {
		margin: 0;
		font-size: 20px;
	}
	.level-title {
		color: var(--muted);
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tools {
		display: flex;
		gap: 6px;
		padding: 0;
	}
	.tool {
		width: 40px;
		height: 40px;
		padding: 0;
		display: grid;
		place-items: center;
	}
	.tool:disabled {
		opacity: 0.4;
		cursor: default;
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
	 * The board sizes itself: a cell is as big as fits the row's width (container
	 * units) and the small viewport height (steady while a phone's address bar comes
	 * and goes), less room for the bar, tray and controls, between 9px and 44px.
	 */
	.mosaic {
		container-type: inline-size;
	}
	.stage {
		--pad: 12px;
		--gap: 2px;
		--fit-w: calc((min(100cqw, 1000px) - 2 * var(--pad) - (var(--w) - 1) * var(--gap)) / var(--w));
		--fit-h: calc(
			(max(100svh - 340px, 200px) - 2 * var(--pad) - (var(--h) - 1) * var(--gap)) / var(--h)
		);
		/* Whole pixels, so dots and their rings sit exactly centered in their cells. */
		--cell: round(down, clamp(9px, min(var(--fit-w), var(--fit-h)), 44px), 1px);
		--slot: round(down, clamp(22px, calc(var(--cell) * 0.9), 36px), 1px);
		--board-w: calc(var(--w) * var(--cell) + (var(--w) - 1) * var(--gap) + 2 * var(--pad));
		--board-h: calc(var(--h) * var(--cell) + (var(--h) - 1) * var(--gap) + 2 * var(--pad));

		display: flex;
		flex-direction: column;
		/* Centered by whole-pixel margins rather than by flex, which can split a pixel. */
		align-items: flex-start;
		gap: 12px;
	}
	.board-wrap {
		margin-left: max(0px, round(down, calc((100cqw - var(--snap-w)) / 2), 1px));
	}
	/* Phones: the board takes the full width (the page scrolls if the tray ends up below). */
	@media (max-width: 500px) {
		.stage {
			--pad: 4px;
			--gap: 1px;
			--cell: round(down, clamp(9px, var(--fit-w), 44px), 1px);
		}
	}
	.stage.won {
		--edge: var(--secondary-color);
	}
	/* The board and the tray under it are one piece (see joined.css), so dots fly within it. */
	.board-wrap {
		--snap-w: var(--board-w);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: var(--board-w);
		max-width: 100%;
	}

	/* Picture: two layers. Bottom = the color each spot needs. Top = the dot sitting on it. */
	.board {
		display: grid;
		grid-template-columns: repeat(var(--w), var(--cell));
		gap: var(--gap);
		padding: var(--pad);
		user-select: none;
		-webkit-user-select: none;
		transform-origin: 0 0;
	}
	/* The board sits inside a fixed-size window that can be zoomed and dragged. */
	.board-view {
		position: relative;
		overflow: hidden;
		width: var(--board-w);
		height: var(--board-h);
		touch-action: none;
		/* Raised dots stay under the tray where the two meet. */
		isolation: isolate;
	}
	.board-view.zoomed {
		cursor: grab;
	}
	.board-view.dragging {
		cursor: grabbing;
	}
	/* The tray's count and the zoom sit under the tray, so they never cover the picture. */
	.under {
		align-self: stretch;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-top: 8px;
	}
	.count {
		font-family: Courier, monospace;
		font-size: 12px;
		font-weight: 700;
		color: var(--muted);
		padding: 0 4px;
	}
	.count .warn {
		color: var(--accent-color);
	}
	.zoom-ctl {
		display: flex;
		gap: 6px;
	}
	.zoom-btn {
		width: 34px;
		height: 34px;
		padding: 0;
		display: grid;
		place-items: center;
		font-size: 18px;
		font-weight: 700;
		line-height: 1;
	}
	.zoom-btn svg {
		width: 16px;
		height: 16px;
	}
	.zoom-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.cell {
		position: relative;
		width: var(--cell);
		height: var(--cell);
		border-radius: 3px;
		outline: none;
	}
	.cell.void {
		background: transparent;
	}
	/* Covered: the needed color shows around the dot. */
	.cell.covered {
		background: var(--c);
		cursor: pointer;
	}
	/* Open: the true color, with an empty socket where a dot goes. */
	.cell.open {
		background: var(--c);
		cursor: pointer;
	}
	.cell.open::after {
		content: '';
		position: absolute;
		inset: round(calc(var(--cell) * 0.22), 1px);
		border-radius: 50%;
		background: rgb(0 0 0 / 0.28);
		/* A dark hole shows on light colors; the light rim shows on dark colors. */
		box-shadow: 0 0 0 2px rgb(255 255 255 / 0.45);
	}
	.cell.filled {
		background: var(--c);
	}
	/* Open spots your dots could go to: a brighter socket rim. */
	.cell.target::after {
		box-shadow: 0 0 0 2px rgb(255 255 255 / 0.8);
	}
	/* Hovering an open area: outline it; the spots that would fill show a pale dot. */
	/* Outlines are drawn inside the cell, so they never spill into the gaps or neighbors. */
	.cell.region-hover,
	.cell.fill-preview {
		box-shadow: inset 0 0 0 2px var(--text-color);
	}
	.cell.fill-preview::after {
		background: color-mix(in srgb, var(--c) 60%, #fff);
		box-shadow: 0 0 0 2px var(--text-color);
	}
	.cell:focus-visible {
		box-shadow: inset 0 0 0 3px var(--accent-color);
	}
	.board.won .cell {
		border-radius: 0;
	}

	/* Dots (on the board, in the tray, and flying). Flyers are made in script, so they're global. */
	.gem,
	.fx :global(.flyer) {
		width: var(--gem);
		height: var(--gem);
		border-radius: 50%;
		background: var(--c);
		--ring: max(1px, round(calc(var(--cell) * 0.06), 1px));
		box-shadow:
			0 0 0 var(--ring) rgb(0 0 0 / 0.45),
			0 0 0 calc(var(--ring) * 2) rgb(255 255 255 / 0.5);
	}
	.slot .gem,
	.fx :global(.flyer) {
		--ring: max(1px, round(calc(var(--slot) * 0.04), 1px));
	}
	.cell .gem {
		position: absolute;
		inset: round(calc(var(--cell) * 0.2), 1px);
		width: auto;
		height: auto;
		z-index: 1;
	}
	.gem.ghost {
		visibility: hidden;
	}
	/* Picked up: a dark ring; the dot it's centered on gets the site's pink. */
	/* Hovering a dot outlines its group with a dashed ring, unlike the solid ring of a picked-up group. */
	.gem.hl {
		outline: max(2px, round(calc(var(--ring) * 1.5), 1px)) dashed var(--text-color);
		outline-offset: var(--ring);
	}
	/* Picked up: a light ring inside a dark one, so it reads on any color. */
	.gem.sel {
		box-shadow:
			0 0 0 var(--ring) rgb(255 255 255 / 0.9),
			0 0 0 calc(var(--ring) * 3) var(--text-color);
		z-index: 3;
	}
	.gem.sel.center {
		box-shadow:
			0 0 0 var(--ring) rgb(255 255 255 / 0.9),
			0 0 0 calc(var(--ring) * 3) var(--accent-color);
		z-index: 4;
	}
	/*
	 * Tray: a tab 24px in from each side of the board. Its slots' rows hold as many
	 * whole slots as fit, or all of them if they fit on one row, centered by a
	 * whole-pixel left padding.
	 */
	.tray-tab {
		--tray-gap: round(calc(var(--slot) * 0.14), 1px);
		--tab-w: calc(var(--board-w) - 48px);
		--room: calc(var(--tab-w) - 20px);
		width: var(--tab-w);
		margin-left: 24px;
		display: grid;
	}
	/* The tray and the end panel share one spot, so the panel never moves the page. */
	.tray-tab > :global(*) {
		grid-area: 1 / 1;
	}
	.tray {
		--row-w: min(
			calc(
				round(down, calc(var(--room) + var(--tray-gap)), calc(var(--slot) + var(--tray-gap))) -
					var(--tray-gap)
			),
			calc(var(--n) * var(--slot) + (var(--n) - 1) * var(--tray-gap))
		);
		display: flex;
		flex-wrap: wrap;
		gap: var(--tray-gap);
		padding: 8px;
		padding-left: calc(8px + round(down, calc((var(--room) - var(--row-w)) / 2), 1px));
		cursor: default;
	}
	.slot {
		width: var(--slot);
		height: var(--slot);
		border-radius: 50%;
		background: var(--slotbg);
		position: relative;
	}
	/* Room around each tray dot for its selection ring, so neighbors don't paint over it. */
	.slot .gem {
		position: absolute;
		inset: round(calc(var(--slot) * 0.16), 1px);
		width: auto;
		height: auto;
		cursor: pointer;
	}
	.tray.warn .slot:empty {
		background: color-mix(in srgb, var(--accent-color) 25%, var(--slotbg));
	}
	.slot.drop {
		cursor: pointer;
	}
	.slot.fill-preview {
		box-shadow: 0 0 0 2px var(--text-color);
	}
	.slot.group-start {
		margin-left: round(calc(var(--slot) * 0.35), 1px);
	}
	.tray.hidden {
		visibility: hidden;
	}
	.tray-tab.nofit {
		--edge: var(--accent-color);
	}
	/* Flying dots */
	.fx {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 50;
	}
	.fx :global(.flyer) {
		position: fixed;
		margin: 0;
		will-change: transform;
	}

	@media (max-width: 500px) {
		:global(body .content:has(> .mosaic)) {
			padding-left: 6px;
			padding-right: 6px;
		}
	}
</style>
