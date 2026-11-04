<!--
	Mosaic: renders the engine state, handles the two-tap moves, zoom and pan, and animates.
	The engine state is mutated in place by the engine, so `version` is bumped after each
	change and everything derived from the state reads it.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Attachment } from 'svelte/attachments';

	import * as E from './engine';
	import type { Action, Dst, Level, MoveResult, Sel, State } from './engine';
	import { art, drawArt } from './art';
	import { loadSave, persist, type Save } from './save';
	import { Flights, snapshotRects } from './flights';
	import { blip } from './sound';

	interface Props {
		levels: Level[];
		/** Start on this level instead of the saved one. */
		start?: number;
		/** Play without reading or writing saved progress, e.g. to play-test a draft. */
		sandbox?: boolean;
	}

	let { levels, start, sandbox = false }: Props = $props();

	const STAGGER = 40;
	const BOARD_PAD = 12;
	const MAX_ZOOM = 4;
	const TIPS = [
		'Tap a dot to pick up its group. Then tap where it goes: an empty tray slot, or an open spot of the same color.',
		'The color around each dot is what that spot needs. Lift dots off to open spots up.',
		'If there isn’t room for the whole group, the dots closest to the one you tapped go first.'
	];

	let save: Save = $state({ completed: {}, level: 0, relaxed: false, muted: false });
	let levelIndex = $state(0);
	/** Bumps on each new level, so the board is rebuilt rather than reused. */
	let levelKey = $state(0);
	let game: State | null = $state.raw(null);
	let version = $state(0);
	let initial: State | null = null;
	let history: State[] = [];
	let historyLen = $state(0);
	let sel: Sel | null = $state.raw(null);
	let hintMove: Action | null = $state.raw(null);
	let hoverCell = $state(-1);
	let trayHover: { color: number } | { slot: true } | null = $state(null);
	let focusCell = $state(-1);
	let status = $state('');
	let statusTimer: ReturnType<typeof setTimeout> | undefined;
	let overlay: 'levels' | 'win' | 'stuck' | null = $state(null);
	let won = $state(false);
	let trayBump = $state(false);
	let winText = $state('');

	const pendingCells = new SvelteSet<number>();
	const pendingTray = new SvelteSet<number>();
	const popping = new SvelteSet<number>();
	const flights = new Flights();

	let rootEl: HTMLElement | undefined = $state();
	let viewEl: HTMLElement | undefined = $state();
	let boardEl: HTMLElement | undefined = $state();
	let trayEl: HTMLElement | undefined = $state();
	let fxEl: HTMLElement | undefined = $state();
	let winNextEl: HTMLButtonElement | undefined = $state();
	let reduceMotion: MediaQueryList | null = null;

	let grid = $state({ cell: 24, gap: 2, slot: 30 });
	let zoom = $state({ scale: 1, tx: 0, ty: 0, w: 0, h: 0 });
	const zoomed = $derived(zoom.scale > 1.01);

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
		const hintSrc = new Set(
			hintMove?.sel.from === 'board' ? (E.groupAt(s, hintMove.sel.cell)?.cells ?? []) : []
		);
		const hintDst = hintMove?.dst.to === 'spot' ? hintMove.dst.cell : -1;
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
			if (i === hintDst) cls += ' hint-dst';
			let dotCls = picked.has(i) ? 'sel' : hintSrc.has(i) ? 'hint' : '';
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
			else if (g && hintMove?.sel.from === 'tray' && hintMove.sel.color === g.c) cls = 'hint';
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
		if (!s) return { used: 0, cap: 0, warn: false, nofit: false, hintDst: false };
		const free = s.trayCap - s.tray.length;
		return {
			used: s.tray.length,
			cap: s.trayCap,
			warn: free <= 2,
			nofit: sel?.from === 'board' && free === 0,
			hintDst: hintMove?.dst.to === 'tray'
		};
	});

	// ---------- messages ----------
	const defaultStatus = () => TIPS[levelIndex] || '';

	function say(msg: string, sticky = false) {
		clearTimeout(statusTimer);
		status = msg;
		if (!sticky) statusTimer = setTimeout(() => (status = defaultStatus()), 4000);
	}

	function sound(i: number, soft = false) {
		if (!save.muted) blip(i, soft);
	}

	// ---------- level setup ----------
	async function startLevel(i: number) {
		cancelFlights();
		overlay = null;
		levelIndex = i;
		save.level = i;
		keep();
		game = E.buildPuzzle(levels[i], i, { relaxed: save.relaxed });
		initial = E.clone(game);
		history = [];
		historyLen = 0;
		sel = null;
		hintMove = null;
		hoverCell = -1;
		won = false;
		focusCell = game.target.findIndex((c) => c >= 0);
		levelKey++;
		sync();
		say(defaultStatus(), true);
		await tick();
		fit();
	}

	/** Size the board and tray so everything fits the screen. */
	function fit() {
		const s = game;
		if (!s || !rootEl || !viewEl) return;
		const avail = Math.min(rootEl.clientWidth, 1000) - 2 * BOARD_PAD;
		const slotGuess = 30;
		const perRow = Math.max(1, Math.floor((avail - 16) / (slotGuess * 1.14)));
		const trayRows = Math.ceil(s.trayCap / perRow);
		const top = viewEl.getBoundingClientRect().top + window.scrollY;
		// Below the board: tray rows, the tray's padding and heading, and some margin.
		const room =
			window.innerHeight - top - trayRows * slotGuess * 1.14 - 16 - 30 - 28 - 2 * BOARD_PAD;
		// Pick the biggest cell that fits both ways, with thinner gaps on big pictures.
		let cell = 44;
		let gap = 2;
		for (; cell > 9; cell--) {
			gap = cell >= 22 ? 2 : 1;
			const w = cell * s.w + gap * (s.w - 1);
			const h = cell * s.h + gap * (s.h - 1);
			if (w <= avail && h <= Math.max(room, 200)) break;
		}
		grid = { cell, gap, slot: Math.max(22, Math.min(36, Math.floor(cell * 0.9))) };
		// The view window is the board's fitted size; zooming happens inside it.
		zoom.w = s.w * cell + gap * (s.w - 1) + 2 * BOARD_PAD;
		zoom.h = s.h * cell + gap * (s.h - 1) + 2 * BOARD_PAD;
		setZoom(1, 0, 0);
	}

	// ---------- zoom and pan ----------
	function setZoom(scale: number, tx: number, ty: number) {
		const k = Math.max(1, Math.min(MAX_ZOOM, scale));
		// Keep the board covering the window: no empty edges when zoomed in.
		zoom.scale = k;
		zoom.tx = Math.min(0, Math.max(zoom.w - zoom.w * k, tx));
		zoom.ty = Math.min(0, Math.max(zoom.h - zoom.h * k, ty));
	}

	/** Zoom to `scale`, keeping the point (px, py) inside the window fixed under the finger. */
	function zoomAt(scale: number, px: number, py: number) {
		const next = Math.max(1, Math.min(MAX_ZOOM, scale));
		const k = next / zoom.scale;
		setZoom(next, px - (px - zoom.tx) * k, py - (py - zoom.ty) * k);
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
		start: { mid: Pt; dist: number; scale: number; tx: number; ty: number; n: number } | null;
	} = { pts: new Map(), moved: false, start: null };
	let dragging = $state(false);

	function gestureStart() {
		const pts = Array.from(gesture.pts.values());
		const mid: Pt =
			pts.length > 1 ? [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2] : pts[0];
		const dist = pts.length > 1 ? Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]) : 0;
		gesture.start = { mid, dist, scale: zoom.scale, tx: zoom.tx, ty: zoom.ty, n: pts.length };
	}

	function onPointerDown(e: PointerEvent) {
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
			const scale = Math.max(1, Math.min(MAX_ZOOM, g.scale * (dist / Math.max(1, g.dist))));
			const cx = (g.mid[0] - g.tx) / g.scale;
			const cy = (g.mid[1] - g.ty) / g.scale;
			setZoom(scale, mid[0] - cx * scale, mid[1] - cy * scale);
			gesture.moved = true;
		} else if (pts.length === 1 && g.n === 1) {
			const dx = pts[0][0] - g.mid[0];
			const dy = pts[0][1] - g.mid[1];
			if (!gesture.moved && Math.hypot(dx, dy) < 8) return; // still a tap
			if (zoom.scale <= 1.01) return; // nothing to pan at full view
			gesture.moved = true;
			dragging = true;
			setZoom(zoom.scale, g.tx + dx, g.ty + dy);
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
				zoomAt(zoom.scale * Math.exp(-e.deltaY * 0.01), px, py);
			} else if (zoom.scale > 1.01) {
				e.preventDefault();
				setZoom(zoom.scale, zoom.tx - e.deltaX, zoom.ty - e.deltaY);
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
		const step = grid.cell + grid.gap;
		const x = BOARD_PAD + (i % s.w) * step + grid.cell / 2;
		const y = BOARD_PAD + Math.floor(i / s.w) * step + grid.cell / 2;
		return [r.left + zoom.tx + x * zoom.scale, r.top + zoom.ty + y * zoom.scale];
	}

	/** Nearest cell to (x, y) passing `ok`, within about a fingertip; -1 if none. */
	function nearestCell(x: number, y: number, ok: (i: number) => boolean): number {
		const s = game!;
		const cellPx = (grid.cell + grid.gap) * zoom.scale;
		const reach = Math.max(22, cellPx * 0.75);
		const r = viewEl!.getBoundingClientRect();
		const step = grid.cell + grid.gap;
		const col = Math.floor(((x - r.left - zoom.tx) / zoom.scale - BOARD_PAD) / step);
		const row = Math.floor(((y - r.top - zoom.ty) / zoom.scale - BOARD_PAD) / step);
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
		return best;
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
		if (hit >= 0 && (isDot(hit) || isDrop(hit))) return hit;
		if (sel) {
			const d = nearestCell(x, y, isDrop);
			if (d >= 0) return d;
		}
		const d = nearestCell(x, y, isDot);
		return d >= 0 ? d : hit;
	}

	// ---------- selecting and moving ----------
	function sameSel(a: Sel, b: Sel) {
		if (a.from === 'tray' || b.from === 'tray') {
			return a.from === 'tray' && b.from === 'tray' && a.color === b.color;
		}
		return a.cell === b.cell;
	}

	function select(next: Sel | null) {
		sel = next;
		hintMove = hintMove && next && sameSel(hintMove.sel, next) ? hintMove : null;
		sync();
		if (!sel || !game) return;
		const dots = E.selectionDots(game, sel)!;
		const open = E.openCount(game, dots[0].gem.c);
		const where =
			sel.from === 'board'
				? 'an empty tray slot, or an open spot of this color'
				: 'an open spot of this color';
		say(
			`Picked up ${plural(dots.length, 'dot', 'dots')}. Tap ${where}. ${plural(open, 'spot is', 'spots are')} open for it.`,
			true
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
		hintMove = null;
		sync();
		if (keep) {
			const n = res.left;
			const where = keep.from === 'tray' ? 'in the tray' : 'picked up';
			const them = n === 1 ? 'it' : 'them';
			say(
				`${plural(n, 'dot didn’t', 'dots didn’t')} fit, so ${n === 1 ? 'it is' : 'they are'} still ${where}. Tap another spot, or tap ${them} to put ${them} down.`,
				true
			);
		} else {
			say(defaultStatus(), true);
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

	async function bumpTray() {
		trayBump = false;
		await tick();
		requestAnimationFrame(() => (trayBump = true));
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
		popping.add(i);
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
		popping.clear();
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
		say('Picture complete!', true);
		setTimeout(async () => {
			if (!game || !E.isWon(game)) return;
			winText = `${lv.name}, finished in ${plural(game.moves, 'move', 'moves')}.`;
			overlay = 'win';
			await tick();
			winNextEl?.focus();
		}, 900);
	}

	// ---------- undo, restart, hint ----------
	function undo() {
		if (!history.length || (overlay && overlay !== 'stuck')) return;
		cancelFlights();
		overlay = null;
		game = history.pop()!;
		historyLen = history.length;
		sel = null;
		hintMove = null;
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
		hintMove = null;
		won = false;
		sync();
		say('Fresh start. Undo brings your last game back.');
	}

	function showHint() {
		if (!game || overlay || E.isWon(game)) return;
		const m = E.hint(game);
		if (!m) {
			say('No safe move from here. Try Undo.');
			return;
		}
		sel = m.sel.from === 'board' ? pickBoard(m.sel.cell) : m.sel;
		hintMove = m;
		sync();
		const what = m.sel.from === 'tray' ? 'these tray dots' : 'this group';
		const where = m.dst.to === 'tray' ? 'the tray' : 'the marked spot';
		say(`Hint: ${what} is picked up. Tap ${where} to move it.`, true);
	}

	function toggleSound() {
		save.muted = !save.muted;
		keep();
		if (!save.muted) blip(4);
	}

	function setRelaxed(on: boolean) {
		save.relaxed = on;
		keep();
		startLevel(levelIndex).then(() => (overlay = 'levels'));
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

	function onBoardHover(e: PointerEvent) {
		if (e.pointerType !== 'mouse') return;
		hoverCell = cellFrom(e);
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
			if (overlay === 'levels') overlay = null;
			else if (sel) select(null);
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
		else if (key === 'h') showHint();
		else if (key === 'r') restart();
		else if (key === 't' && sel?.from === 'board' && !overlay) tryMove({ to: 'tray' });
	}

	let resizeTimer: ReturnType<typeof setTimeout> | undefined;
	function onResize() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(fit, 80);
	}

	const winArt: Attachment<HTMLCanvasElement> = (canvas) => {
		drawArt(canvas, levels[levelIndex], true, 220);
	};

	onMount(() => {
		reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
		if (!sandbox) save = loadSave();
		const first = start ?? save.level;
		startLevel(Math.min(Math.max(0, first | 0), levels.length - 1));
		return () => {
			cancelFlights();
			clearTimeout(statusTimer);
			clearTimeout(resizeTimer);
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

<div
	class="mosaic"
	bind:this={rootEl}
	style:--cell="{grid.cell}px"
	style:--gap="{grid.gap}px"
	style:--slot="{grid.slot}px"
>
	<div class="bar">
		<div class="titles">
			<div class="brand">Mosaic</div>
			<div class="level-title">{title}</div>
		</div>
		<nav class="tools" aria-label="Game controls">
			<button
				class="icon-btn"
				title="Undo (Z)"
				aria-label="Undo"
				disabled={!historyLen}
				onclick={undo}
			>
				<svg viewBox="0 0 24 24"
					><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg
				>
			</button>
			<button class="icon-btn" title="Hint (H)" aria-label="Hint" onclick={showHint}>
				<svg viewBox="0 0 24 24">
					<path d="M9 18h6M10 21h4" />
					<path
						d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"
					/>
				</svg>
			</button>
			<button class="icon-btn" title="Restart (R)" aria-label="Restart level" onclick={restart}>
				<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8" /><path d="M3 3v5h5" /></svg>
			</button>
			<button
				class="icon-btn"
				title="Sound"
				aria-label={save.muted ? 'Turn sound on' : 'Turn sound off'}
				onclick={toggleSound}
			>
				{#if save.muted}
					<svg viewBox="0 0 24 24"
						><path d="M11 5 6 9H3v6h3l5 4z" /><path d="m16 9 6 6M22 9l-6 6" /></svg
					>
				{:else}
					<svg viewBox="0 0 24 24">
						<path d="M11 5 6 9H3v6h3l5 4z" />
						<path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
					</svg>
				{/if}
			</button>
			<button
				class="icon-btn"
				title="Pictures"
				aria-label="All pictures"
				onclick={() => (overlay = 'levels')}
			>
				<svg viewBox="0 0 24 24">
					<rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
					<rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
					<rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
					<rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
				</svg>
			</button>
		</nav>
	</div>

	<div class="stage">
		<p class="status" aria-live="polite">{status}</p>

		<!-- Cells take Enter and Space; this handler adds forgiving taps and zoom gestures. -->
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div
			class="board-view"
			class:zoomed
			class:dragging
			bind:this={viewEl}
			style:width="{zoom.w}px"
			style:height="{zoom.h}px"
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
					style:--w={game?.w ?? 1}
					style:transform="translate({zoom.tx}px, {zoom.ty}px) scale({zoom.scale})"
					onkeydown={onBoardKey}
					onpointerover={onBoardHover}
					onpointerleave={() => (hoverCell = -1)}
				>
					{#each boardView as v, i (i)}
						{#if v}
							<div
								class="cell {v.cls}"
								class:pop={popping.has(i)}
								class:region-hover={hover.region.has(i)}
								class:fill-preview={hover.fill.has(i)}
								data-i={i}
								role="gridcell"
								tabindex={i === focusCell ? 0 : -1}
								aria-label={v.label}
								style:--c={v.hex}
								onanimationend={() => popping.delete(i)}
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
			<div class="zoom-ctl" aria-label="Zoom">
				<button
					class="zoom-btn"
					aria-label="Zoom in"
					title="Zoom in"
					disabled={zoom.scale >= MAX_ZOOM - 0.01}
					onclick={() => zoomAt(zoom.scale * 1.6, zoom.w / 2, zoom.h / 2)}>+</button
				>
				<button
					class="zoom-btn"
					aria-label="Zoom out"
					title="Zoom out"
					disabled={!zoomed}
					onclick={() => zoomAt(zoom.scale / 1.6, zoom.w / 2, zoom.h / 2)}>&minus;</button
				>
				<button
					class="zoom-btn"
					aria-label="Show whole picture"
					title="Show whole picture"
					disabled={!zoomed}
					onclick={() => setZoom(1, 0, 0)}
				>
					<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
				</button>
			</div>
		</div>

		<div class="tray-wrap" style:max-width="{Math.max(zoom.w, 10 * grid.slot * 1.14 + 16)}px">
			<div class="tray-head">
				<span>Tray</span>
				<span class:warn={trayState.warn}>{trayState.used} / {trayState.cap}</span>
			</div>
			<!-- Tray dots and slots are reached by pointer; the keyboard sends picked-up dots here with T. -->
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
			<div
				class="tray"
				class:warn={trayState.warn}
				class:nofit={trayState.nofit}
				class:hint-dst={trayState.hintDst}
				class:bump={trayBump}
				bind:this={trayEl}
				onclick={onTray}
				onpointerover={onTrayHover}
				onpointerleave={() => (trayHover = null)}
				onanimationend={() => (trayBump = false)}
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
		</div>
	</div>

	<div class="fx" bind:this={fxEl} aria-hidden="true"></div>

	{#if overlay === 'levels'}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
		<div class="overlay" onclick={(e) => e.target === e.currentTarget && (overlay = null)}>
			<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="levels-h">
				<div class="sheet-head">
					<h2 id="levels-h">Pictures</h2>
					<button class="icon-btn" aria-label="Close" onclick={() => (overlay = null)}>
						<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" /></svg>
					</button>
				</div>
				<label class="toggle">
					<input
						type="checkbox"
						checked={save.relaxed}
						onchange={(e) => setRelaxed(e.currentTarget.checked)}
					/>
					<span>
						<b>Relaxed mode</b><br /><small>A much bigger tray, so you can lift dots freely.</small>
					</span>
				</label>
				<div class="grid">
					{#each levels as lv, i (lv.id)}
						{@const done = !!save.completed[lv.id]}
						<button
							class="card"
							class:current={i === levelIndex}
							aria-label="{i + 1}. {lv.name}{done ? ', complete' : ''}"
							onclick={() => startLevel(i)}
						>
							<span class="thumb"><canvas {@attach art(lv, done, 72)}></canvas></span>
							<span>{i + 1}. {lv.name}</span>
							{#if done}<span class="done" aria-hidden="true">✓</span>{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{:else if overlay === 'win'}
		<div class="overlay">
			<div class="sheet small" role="dialog" aria-modal="true" aria-labelledby="win-h">
				<h2 id="win-h">Picture complete</h2>
				<p class="muted">{winText}</p>
				<canvas class="win-art" {@attach winArt}></canvas>
				<div class="row">
					<button class="btn" onclick={() => (overlay = 'levels')}>All pictures</button>
					<button
						class="btn primary"
						bind:this={winNextEl}
						onclick={() => startLevel((levelIndex + 1) % levels.length)}
					>
						{levelIndex === levels.length - 1 ? 'Back to the first' : 'Next picture'}
					</button>
				</div>
			</div>
		</div>
	{:else if overlay === 'stuck'}
		<div class="overlay">
			<div class="sheet small" role="dialog" aria-modal="true" aria-labelledby="stuck-h">
				<h2 id="stuck-h">Out of room</h2>
				<p class="muted">
					No group fits in the tray or in open spots. Undo a few moves, or start the picture over.
				</p>
				<div class="row">
					<button
						class="btn"
						onclick={() => {
							overlay = null;
							restart();
						}}>Start over</button
					>
					<button class="btn primary" onclick={undo}>Undo</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* Game colors follow the site theme (light and dark come from data-theme on <html>). */
	.mosaic {
		--bg: var(--primary-color);
		--panel: color-mix(in srgb, var(--input-color) 60%, var(--primary-color));
		--ink: var(--text-color);
		--muted: color-mix(in srgb, var(--text-color) 70%, var(--primary-color));
		--line: var(--text-color-st);
		--accent: var(--accent-color);
		--good: #2f9e5b;
		--bad: #e5484d;
		--slotbg: color-mix(in srgb, var(--text-color) 10%, var(--primary-color));
		--silhouette: color-mix(in srgb, var(--text-color) 22%, var(--primary-color));
		--shadow: 0 0 0 2px var(--text-color-st);
		--gem: 30px;

		width: 100%;
		max-width: 1200px;
		color: var(--ink);
		-webkit-tap-highlight-color: transparent;
	}
	button {
		color: inherit;
	}

	/* Game bar */
	.bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 0 6px;
	}
	.titles {
		flex: 1;
		min-width: 0;
	}
	.brand {
		font-weight: 700;
		font-size: 18px;
	}
	.level-title {
		color: var(--muted);
		font-weight: 600;
		font-size: 13px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.tools {
		display: flex;
		gap: 6px;
	}
	.icon-btn {
		width: 40px;
		height: 40px;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: var(--panel);
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
	}
	.icon-btn:hover:not(:disabled) {
		border-color: var(--muted);
	}
	.icon-btn:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.icon-btn:focus-visible,
	.zoom-btn:focus-visible,
	.btn:focus-visible,
	.card:focus-visible {
		box-shadow: 0 0 0 3px var(--accent);
	}
	svg {
		width: 20px;
		height: 20px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	/* Layout */
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
	}
	.status {
		margin: 0;
		min-height: 2.8em;
		max-width: 44ch;
		display: flex;
		align-items: center;
		justify-content: center;
		text-align: center;
		color: var(--muted);
	}

	/* Picture: two layers. Bottom = the color each spot needs. Top = the dot sitting on it. */
	.board {
		display: grid;
		grid-template-columns: repeat(var(--w), var(--cell));
		gap: var(--gap, 2px);
		padding: 12px;
		background: var(--panel);
		border-radius: 18px;
		user-select: none;
		-webkit-user-select: none;
		transform-origin: 0 0;
		transition: none;
	}
	/* The board sits inside a fixed-size window that can be zoomed and dragged. */
	.board-view {
		position: relative;
		overflow: hidden;
		border-radius: 18px;
		box-shadow: var(--shadow);
		background: var(--panel);
		touch-action: none;
		transition: none;
	}
	.board-view.zoomed {
		cursor: grab;
	}
	.board-view.dragging {
		cursor: grabbing;
	}
	.zoom-ctl {
		position: absolute;
		right: 8px;
		bottom: 8px;
		display: flex;
		gap: 6px;
		z-index: 5;
	}
	.zoom-btn {
		width: 36px;
		height: 36px;
		border-radius: 10px;
		border: 1px solid var(--line);
		background: color-mix(in srgb, var(--panel) 88%, transparent);
		font-size: 20px;
		font-weight: 700;
		line-height: 1;
		display: grid;
		place-items: center;
		cursor: pointer;
		padding: 0;
		box-shadow: 0 2px 6px rgb(0 0 0 / 0.3);
	}
	.zoom-btn svg {
		width: 18px;
		height: 18px;
	}
	.zoom-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}
	.cell {
		position: relative;
		width: var(--cell);
		height: var(--cell);
		border-radius: 22%;
		outline: none;
		transition: none;
	}
	.cell.void {
		background: transparent;
	}
	/* Covered: the needed color shows clearly around the dot. */
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
		inset: 20%;
		border-radius: 50%;
		background: rgb(0 0 0 / 0.32);
		/* Dark hole shows on light colors; light rim shows on dark colors. */
		box-shadow:
			inset 0 2px 4px rgb(0 0 0 / 0.45),
			0 0 0 1.5px rgb(255 255 255 / 0.45);
	}
	/* Filled: solid pixel. */
	.cell.filled {
		background: var(--c);
		border-radius: 3px;
	}
	/* Open spots your dots could go to: a calm, brighter socket rim. */
	.cell.target::after {
		box-shadow:
			inset 0 2px 4px rgb(0 0 0 / 0.45),
			0 0 0 2px rgb(255 255 255 / 0.75);
	}
	/* Hovering an open area: outline it, and ghost dots show exactly which spots would fill. */
	.cell.region-hover,
	.cell.fill-preview {
		box-shadow: 0 0 0 2px var(--ink);
		z-index: 1;
	}
	.cell.fill-preview::after {
		background: color-mix(in srgb, var(--c) 65%, #fff);
		box-shadow:
			0 0 0 2px rgb(0 0 0 / 0.5),
			0 0 0 3.5px rgb(255 255 255 / 0.8);
		opacity: 0.9;
	}
	.cell.hint-dst {
		box-shadow: 0 0 0 3px var(--accent);
	}
	.cell:focus-visible {
		box-shadow: 0 0 0 3px var(--accent);
		z-index: 2;
	}
	.cell.pop {
		z-index: 1;
		animation: pop 0.32s ease-out;
	}
	@keyframes pop {
		0% {
			transform: scale(0.5);
			filter: brightness(1.5);
		}
		70% {
			transform: scale(1.15);
		}
		100% {
			transform: scale(1);
		}
	}
	.board.won {
		animation: glow 1.1s ease;
	}
	@keyframes glow {
		40% {
			box-shadow: inset 0 0 0 4px var(--accent);
		}
	}

	/* Dots (on the board, in the tray, and flying). Flyers are made in script, so they're global. */
	.gem,
	.fx :global(.flyer) {
		width: var(--gem);
		height: var(--gem);
		border-radius: 50%;
		/* True color, with only a small shine, so a dot looks exactly like the spot it belongs on. */
		background:
			radial-gradient(circle at 34% 30%, rgb(255 255 255 / 0.55) 0 9%, transparent 26%), var(--c);
		--ring: max(1px, calc(var(--cell) * 0.06));
		box-shadow:
			0 0 0 var(--ring) rgb(0 0 0 / 0.5),
			0 0 0 calc(var(--ring) * 1.8) rgb(255 255 255 / 0.55),
			0 calc(var(--ring) * 1.5) calc(var(--ring) * 2.5) rgb(0 0 0 / 0.4);
		transition:
			transform 0.14s ease,
			box-shadow 0.14s ease;
	}
	.slot .gem,
	.fx :global(.flyer) {
		--ring: max(1px, calc(var(--slot) * 0.06));
	}
	.cell .gem {
		position: absolute;
		inset: 22%;
		width: auto;
		height: auto;
		z-index: 1;
	}
	.gem.ghost {
		visibility: hidden;
	}
	.gem.hl {
		transform: scale(1.12);
	}
	.gem.sel {
		transform: scale(1.15) translateY(-5%);
		box-shadow:
			0 0 0 var(--ring) rgb(0 0 0 / 0.5),
			0 0 0 calc(var(--ring) * 2) var(--ink),
			0 calc(var(--ring) * 2) calc(var(--ring) * 3) rgb(0 0 0 / 0.45);
		z-index: 3;
	}
	.gem.hint {
		animation: hint 0.9s ease-in-out infinite;
	}
	.gem.sel.center {
		transform: scale(1.3) translateY(-8%);
		box-shadow:
			0 0 0 var(--ring) rgb(0 0 0 / 0.5),
			0 0 0 calc(var(--ring) * 2.6) var(--accent),
			0 calc(var(--ring) * 2) calc(var(--ring) * 3.5) rgb(0 0 0 / 0.5);
		z-index: 4;
	}
	@keyframes hint {
		50% {
			transform: scale(1.25);
			box-shadow:
				0 0 0 3px var(--accent),
				0 4px 10px rgb(0 0 0 / 0.35);
		}
	}

	/* Tray */
	.tray-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
		width: 100%;
	}
	.tray-head {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted);
		padding: 0 4px;
	}
	.tray-head .warn {
		color: var(--bad);
	}
	.tray {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: calc(var(--slot) * 0.14);
		padding: 8px;
		background: var(--panel);
		border-radius: 14px;
		box-shadow: var(--shadow);
		cursor: default;
		transition: box-shadow 0.15s;
	}
	.slot {
		width: var(--slot);
		height: var(--slot);
		border-radius: 50%;
		background: var(--slotbg);
		box-shadow: inset 0 1px 3px rgb(0 0 0 / 0.14);
		position: relative;
		transition: none;
	}
	.slot .gem {
		position: absolute;
		inset: 8%;
		width: auto;
		height: auto;
		cursor: pointer;
	}
	.tray.warn .slot:empty {
		background: color-mix(in srgb, var(--bad) 16%, var(--slotbg));
	}
	.slot.drop {
		cursor: pointer;
		box-shadow:
			inset 0 1px 3px rgb(0 0 0 / 0.14),
			0 0 0 1.5px rgb(255 255 255 / 0.35);
	}
	.slot.fill-preview {
		box-shadow: 0 0 0 2px var(--ink);
		background: color-mix(in srgb, var(--ink) 30%, var(--slotbg));
	}
	.slot.group-start {
		margin-left: calc(var(--slot) * 0.35);
	}
	.tray.nofit {
		box-shadow:
			0 0 0 3px var(--bad),
			var(--shadow);
	}
	.tray.hint-dst {
		box-shadow:
			0 0 0 3px var(--accent),
			var(--shadow);
	}
	.tray.bump {
		animation: bump 0.35s;
	}
	@keyframes bump {
		20% {
			transform: translateX(-6px);
		}
		40% {
			transform: translateX(5px);
		}
		60% {
			transform: translateX(-3px);
		}
		80% {
			transform: translateX(2px);
		}
	}

	/* Flying gems */
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

	/* Overlays */
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 100;
		display: grid;
		place-items: center;
		padding: 16px;
		background: rgb(12 10 22 / 0.45);
		backdrop-filter: blur(3px);
	}
	.sheet {
		width: 100%;
		max-width: 600px;
		max-height: calc(100vh - 32px);
		overflow: auto;
		padding: 20px;
		border-radius: 20px;
		background: var(--bg);
		box-shadow: 0 20px 60px rgb(0 0 0 / 0.3);
	}
	.sheet.small {
		max-width: 400px;
		text-align: center;
	}
	.sheet h2 {
		margin: 0 0 4px;
		font-size: 20px;
	}
	.sheet-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.muted {
		color: var(--muted);
		margin: 4px 0 0;
	}
	.toggle {
		display: flex;
		gap: 10px;
		align-items: flex-start;
		margin-top: 12px;
		padding: 12px;
		border-radius: 12px;
		background: var(--panel);
		cursor: pointer;
	}
	.toggle input {
		margin-top: 3px;
		width: 18px;
		height: 18px;
		accent-color: var(--accent);
	}
	.toggle small {
		color: var(--muted);
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
		gap: 10px;
		margin-top: 14px;
	}
	.card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 12px 8px 10px;
		border-radius: 14px;
		border: 1px solid var(--line);
		background: var(--panel);
		cursor: pointer;
		font-size: 13px;
		font-weight: 600;
	}
	.card:hover {
		border-color: var(--muted);
	}
	.card.current {
		border-color: var(--accent);
		box-shadow: 0 0 0 1px var(--accent);
	}
	.thumb {
		height: 72px;
		display: grid;
		place-items: center;
	}
	canvas {
		image-rendering: pixelated;
		--silhouette: color-mix(in srgb, var(--text-color) 22%, var(--primary-color));
	}
	.done {
		position: absolute;
		top: 6px;
		right: 8px;
		color: var(--good);
		font-weight: 800;
	}
	.win-art {
		display: block;
		margin: 16px auto 4px;
		border-radius: 6px;
	}
	.row {
		display: flex;
		gap: 10px;
		justify-content: center;
		margin-top: 16px;
		flex-wrap: wrap;
	}
	.btn {
		padding: 10px 16px;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: var(--panel);
		font-weight: 700;
		cursor: pointer;
	}
	.btn.primary {
		background: var(--accent);
		border-color: transparent;
		color: #fff;
	}

	@media (prefers-reduced-motion: reduce) {
		.mosaic :global(*),
		.mosaic :global(*::before),
		.mosaic :global(*::after) {
			animation-duration: 0.01ms !important;
			animation-iteration-count: 1 !important;
			transition: none !important;
		}
	}
</style>
