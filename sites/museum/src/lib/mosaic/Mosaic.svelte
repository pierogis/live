<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import type { Attachment } from 'svelte/attachments';
	import { Card } from '@pierogis/utensils';

	import * as E from './engine';
	import type { Dst, Level, MoveResult, Sel, State } from './engine';
	import LevelEnd from '../shared/game/LevelEnd.svelte';
	import GameBar from '../shared/game/GameBar.svelte';
	import LevelNav from '../shared/game/LevelNav.svelte';
	import '../shared/game/stage.css';
	import { LevelControl, type LevelProps } from '../shared/game/level.svelte';
	import { inkOn } from '../shared/ink';
	import { mosaicSave } from './save';
	import { FLIGHT, Flights, snapshotRects } from './flights';

	const props: LevelProps<Level, State> = $props();

	const SIXTEENTH = 100;
	const CASCADE = 12;
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	const booked = new Set<number>();
	const MAX_ZOOM = 4;
	let touchTap = false;

	let hoverCell = $state(-1);
	let trayHover = $state(-1);
	let focusCell = $state(-1);

	const pendingCells = new SvelteSet<number>();
	const pendingTray = new SvelteSet<number>();
	const flights = new Flights();

	let viewEl: HTMLElement | undefined = $state();
	let boardEl: HTMLElement | undefined = $state();
	let trayEl: HTMLElement | undefined = $state();
	let fxEl: HTMLElement | undefined = $state();

	let zoom = $state({ cell: 0, scale: 1, tx: 0, ty: 0 });
	const zoomed = $derived(zoom.cell > 0);

	const ctl = new LevelControl<Level, State>(
		{
			save: mosaicSave,
			clone: E.clone,
			isWon: E.isWon,
			isStuck: E.isStuck,
			applyOptions: (s, options) => {
				if (options.relaxed) E.relax(s);
			},
			reset: (s, why) => {
				cancelFlights();
				if (why === 'level') {
					hoverCell = -1;
					focusCell = s.target.findIndex((c) => c >= 0);
					resetZoom();
				}
			},
			rhythm: {
				beat: SIXTEENTH,
				fill: true,
				doubles: true,
				harmonize: true,
				feel: true,
				paced: true
			},
			key: (_e, key) => {
				if (key === 't') {
					const s = game;
					if (s && !ctl.overlay && s.top[focusCell]) tryMove(pickBoard(focusCell), { to: 'tray' });
					return true;
				}
			},
			wonStatus: 'Picture complete.'
		},
		() => props
	);
	const game = $derived(ctl.state);
	const trayFlash = ctl.cue(false);

	const title = $derived(ctl.label + (ctl.options.relaxed ? ' · Relaxed' : ''));

	function pickBoard(cell: number): Sel {
		return { from: 'board', cell, cells: E.groupAt(game!, cell)!.cells };
	}

	const boardView = $derived.by(() => {
		void ctl.version;
		const s = game;
		if (!s) return [];
		const inks = s.colors.map((k) => inkOn(k.hex));
		return s.target.map((c, i) => {
			if (c < 0) return null;
			const dot = s.top[i];
			let cls: string;
			let label: string;
			if (dot) {
				cls = 'covered';
				label = 'Spot with a dot on it';
			} else if (s.filled[i]) {
				cls = 'filled';
				label = 'Filled spot';
			} else {
				cls = 'open';
				label = 'Open spot';
			}
			return {
				hex: s.colors[c].hex,
				ink: inks[c],
				alt: ((i % s.w) + Math.floor(i / s.w)) % 2 === 1,
				dot,
				dotHex: dot ? s.colors[dot.c].hex : '',
				cls,
				label
			};
		});
	});

	const hovered = $derived.by(() => {
		void ctl.version;
		const s = game;
		const cell = hoverCell;
		if (!s || cell < 0 || !s.top[cell]) return new Set<number>();
		return new Set(E.groupAt(s, cell)!.cells);
	});

	const trayView = $derived.by(() => {
		void ctl.version;
		const s = game;
		if (!s) return [];
		const out = [];
		for (let k = 0; k < s.trayCap; k++) {
			const g = s.tray[k];
			let cls = '';
			if (g && pendingTray.has(g.id)) cls = 'ghost';
			if (g && g.c === trayHover) cls += ' hl';
			const prev = s.tray[k - 1];
			out.push({
				g,
				hex: g ? s.colors[g.c].hex : '',
				cls,
				groupStart: k > 0 && !!prev && (!g || prev.c !== g.c)
			});
		}
		return out;
	});

	// CSS keeps the widest row that fits, so 20 slots where 19 fit make two rows of 10.
	const trayRows = $derived.by(() => {
		const n = trayView.length;
		const per = [...new Set(Array.from({ length: 12 }, (_, k) => Math.ceil(n / (k + 1))))];
		const w = (p: number) => `(${p} * var(--pitch) - var(--tray-gap))`;
		const fits = (p: number) => `clamp(0, sign(var(--fit-w) - ${w(p)}) + 1, 1)`;
		return `max(${per.map((p) => `calc(${w(p)} * ${fits(p)})`).join(', ')})`;
	});

	const trayState = $derived.by(() => {
		void ctl.version;
		const s = game;
		if (!s) return { used: 0, cap: 0, warn: false };
		const free = s.trayCap - s.tray.length;
		return { used: s.tray.length, cap: s.trayCap, warn: free <= 2 };
	});

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

	function fitCell() {
		const m = metrics();
		const w = game?.w ?? 1;
		return Math.max(1, Math.round((m.w - 2 * m.pad - (w - 1) * m.gap) / w));
	}

	function resetZoom() {
		zoom = { cell: 0, scale: 1, tx: 0, ty: 0 };
	}

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

	const cellNow = () => zoom.cell || fitCell();

	type Pt = [number, number];

	function zoomTo(
		cell: number,
		to: Pt,
		from: { mid: Pt; cell: number; tx: number; ty: number } = {
			mid: to,
			cell: cellNow(),
			tx: zoom.tx,
			ty: zoom.ty
		}
	) {
		const m = metrics();
		const u = (from.mid[0] - from.tx - m.pad) / (from.cell + m.gap);
		const v = (from.mid[1] - from.ty - m.pad) / (from.cell + m.gap);
		const step = Math.round(cell) + m.gap;
		setZoom(cell, to[0] - m.pad - u * step, to[1] - m.pad - v * step);
	}

	function zoomBy(factor: number, at: Pt) {
		const now = cellNow();
		let next = Math.round(now * factor);
		if (next === now) next = now + (factor > 1 ? 1 : -1);
		zoomTo(next, at);
	}

	function zoomMiddle(factor: number) {
		const m = metrics();
		zoomBy(factor, [m.w / 2, m.h / 2]);
	}

	function viewPoint(clientX: number, clientY: number): Pt {
		const r = viewEl!.getBoundingClientRect();
		return [clientX - r.left, clientY - r.top];
	}

	function spread(pts: Pt[]): { mid: Pt; dist: number } {
		if (pts.length < 2) return { mid: pts[0], dist: 0 };
		const [a, b] = pts;
		return {
			mid: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2],
			dist: Math.hypot(a[0] - b[0], a[1] - b[1])
		};
	}

	const gesture: {
		pts: Map<number, Pt>;
		moved: boolean;
		start: { mid: Pt; dist: number; cell: number; tx: number; ty: number; n: number } | null;
	} = { pts: new Map(), moved: false, start: null };
	let dragging = $state(false);

	function gestureStart() {
		const pts = Array.from(gesture.pts.values());
		const { mid, dist } = spread(pts);
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
			const { mid, dist } = spread(pts);
			zoomTo(g.cell * (dist / Math.max(1, g.dist)), mid, g);
			gesture.moved = true;
		} else if (pts.length === 1 && g.n === 1) {
			const dx = pts[0][0] - g.mid[0];
			const dy = pts[0][1] - g.mid[1];
			if (!gesture.moved && Math.hypot(dx, dy) < 8) return;
			if (!zoomed) return;
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

	const wheelZoom: Attachment<HTMLElement> = (node) => {
		const onWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				zoomBy(Math.exp(-e.deltaY * 0.01), viewPoint(e.clientX, e.clientY));
			} else if (zoomed) {
				e.preventDefault();
				setZoom(zoom.cell, zoom.tx - e.deltaX, zoom.ty - e.deltaY);
			}
		};
		node.addEventListener('wheel', onWheel, { passive: false });
		return () => node.removeEventListener('wheel', onWheel);
	};

	function boardFrame() {
		const m = metrics();
		const r = viewEl!.getBoundingClientRect();
		const local = (x: number, y: number): Pt => [
			x - r.left - zoom.tx - m.pad,
			y - r.top - zoom.ty - m.pad
		];
		return { m, local };
	}

	function resolveTap(x: number, y: number, hit: number): number {
		const s = game!;
		const { m, local } = boardFrame();
		const reach = Math.max(touchTap ? 30 : 22, m.step * (touchTap ? 0.95 : 0.75));
		const isDot = (i: number) => !!s.top[i];
		const grid = { w: s.w, h: s.h, cell: m.cell, step: m.step, reach };
		const [lx, ly] = local(x, y);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- this tap's own lookup, not state
		const sizes = new Map<number, number>();
		for (const g of E.boardGroups(s)) for (const c of g.cells) sizes.set(c, g.cells.length);
		const near = m.step * (touchTap ? 0.75 : 0.6);
		const i = E.tapCell(grid, lx, ly, isDot, null, (c) => sizes.get(c) ?? 0, near);
		return i >= 0 ? i : hit;
	}

	async function tryMove(sel: Sel, dst: Dst) {
		if (!game) return;
		const before = E.clone(game);
		const rects = snapshotRects([boardEl, trayEl]);
		const res = E.move(game, sel, dst);
		if (!res.ok) {
			explain(res);
			ctl.music?.nope();
			return;
		}
		ctl.record(before);
		res.toBoard.forEach((p) => pendingCells.add(p.cell));
		res.fromTray.forEach((p) => pendingCells.add(p.cell));
		res.toTray.forEach((p) => pendingTray.add(p.id));
		ctl.touch();
		await tick();
		animate(res, rects);
	}

	function explain(res: MoveResult) {
		if (res.ok) return;
		if (res.reason === 'tray-full') {
			ctl.say('The tray is full.');
			trayFlash.show(true);
		} else if (res.reason === 'color') {
			ctl.say('That spot needs a different color.');
		}
	}

	function onCell(i: number) {
		const s = game;
		if (!s || ctl.overlay || E.isWon(s)) return;
		focusCell = i;
		if (!s.top[i]) return;
		const { sel, dst } = E.tapMove(s, i);
		tryMove(sel, dst);
	}

	function trayColorAt(x: number, y: number): number {
		const s = game;
		if (!trayEl || !s) return -1;
		let best: HTMLElement | null = null;
		let bestD = Infinity;
		for (const slot of trayEl.querySelectorAll<HTMLElement>('.slot')) {
			const r = slot.getBoundingClientRect();
			const d = Math.hypot(r.left + r.width / 2 - x, r.top + r.height / 2 - y);
			if (d < bestD) [best, bestD] = [slot, d];
		}
		const id = best?.querySelector<HTMLElement>('.gem[data-id]')?.dataset.id;
		return id === undefined ? -1 : (s.tray.find((q) => q.id === +id)?.c ?? -1);
	}

	function sendHome(color: number) {
		const s = game!;
		const spot = s.target.findIndex((c, i) => c === color && !s.top[i] && !s.filled[i]);
		if (spot < 0) {
			ctl.say('No open spot for that color yet.');
			ctl.music?.nope();
			return;
		}
		tryMove({ from: 'tray', color }, { to: 'spot', cell: spot });
	}

	function onTray(e: MouseEvent) {
		const s = game;
		if (!s || ctl.overlay || E.isWon(s)) return;
		const color = trayColorAt(e.clientX, e.clientY);
		if (color >= 0) sendHome(color);
	}

	function onTrayHover(e: PointerEvent) {
		if (e.pointerType !== 'mouse' || !game) return;
		trayHover = trayColorAt(e.clientX, e.clientY);
	}

	function cellEl(i: number) {
		return boardEl?.querySelector<HTMLElement>(`[data-i="${i}"]`) ?? null;
	}

	function animate(res: MoveResult, rects: Map<number, DOMRect>) {
		if (!res.ok || !game) return;
		const s = game;
		const colors = s.colors;
		const toSpots = [...res.toBoard, ...res.fromTray];
		const moved = (toSpots[0] ?? res.toTray[0])?.c ?? 0;
		const hex = colors[moved].hex;
		const finishes = toSpots.length > 0 && E.colorDone(s, moved);
		let landing = toSpots.length;
		const landSpot = (cell: number, at: number) => {
			pendingCells.delete(cell);
			ctl.music?.note(hex, false, at);
			if (--landing === 0 && finishes) ctl.finished(hex);
		};
		const landTray = (id: number, at: number) => {
			pendingTray.delete(id);
			ctl.music?.note(hex, true, at);
		};
		const { clock } = ctl;
		const now = performance.now();
		const past = clock.step(now);
		for (const b of booked) if (b < past) booked.delete(b);
		const gearOf = (n: number) => (n <= 2 ? 4 : clock.gear);
		const big = Math.max(toSpots.length, res.toTray.length);
		const first = clock.nearest(now + FLIGHT, gearOf(big));
		const duration = first - now;
		const delayOf = (k: number, n: number) => {
			const g = gearOf(n);
			const lines = Math.min(n, g === 4 ? (CASCADE * 2) / 3 : CASCADE);
			let step = clock.step(first) + g * Math.floor((k * lines) / n);
			if (booked.has(step) && !booked.has(step + 1)) step++;
			booked.add(step);
			return clock.time(step) - first;
		};
		const fly = (
			c: number,
			id: number,
			target: HTMLElement | null,
			k: number,
			n: number,
			onLand: (at: number) => void
		) =>
			flights.launch({
				layer: fxEl,
				hex: colors[c].hex,
				from: rects.get(id),
				target,
				delay: delayOf(k, n),
				duration,
				still: ctl.still,
				onLand,
				onSettle: () => ctl.settle()
			});
		const onto = toSpots.toSorted((a, b) => (a.order ?? 0) - (b.order ?? 0));
		onto.forEach((p, k) =>
			fly(p.c, p.id, cellEl(p.cell), k, onto.length, (at) => landSpot(p.cell, at))
		);
		res.toTray.forEach((p, k) => {
			const to = trayEl?.querySelector<HTMLElement>(`[data-id="${p.id}"]`) ?? null;
			fly(p.c, p.id, to, k, res.toTray.length, (at) => landTray(p.id, at));
		});
		if (!flights.size) ctl.settle();
	}

	function cancelFlights() {
		flights.clear();
		booked.clear();
		pendingCells.clear();
		pendingTray.clear();
	}

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
		// Keyboard and synthetic clicks (detail 0) use the exact cell.
		const i = e.detail > 0 && game ? resolveTap(e.clientX, e.clientY, hit) : hit;
		if (i >= 0) onCell(i);
	}

	function cellAtPoint(clientX: number, clientY: number): number {
		const s = game;
		if (!s || !viewEl) return -1;
		const { m, local } = boardFrame();
		const [lx, ly] = local(clientX, clientY);
		const col = Math.floor((lx + m.gap / 2) / m.step);
		const row = Math.floor((ly + m.gap / 2) / m.step);
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

	function onResize() {
		if (zoomed) setZoom(zoom.cell, zoom.tx, zoom.ty);
	}

	onMount(() => {
		const unmount = ctl.mount();
		return () => {
			unmount();
			cancelFlights();
		};
	});
</script>

<svelte:window
	onresize={onResize}
	onpointermove={onPointerMove}
	onpointerup={onPointerEnd}
	onpointercancel={onPointerEnd}
/>
<svelte:document onkeydown={ctl.onKey} />

<div class="mosaic" style:--w={game?.w ?? 1} style:--h={game?.h ?? 1}>
	<GameBar {...ctl.bar} game="mosaic" label={title} />

	<div class="stage" class:won={ctl.won}>
		<p class="sr-only" aria-live="polite">{ctl.status}</p>

		<div class="board-wrap snapped" class:nofit={trayFlash.value}>
			<Card>
				<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
				<div
					class="board-view"
					class:zoomed
					class:dragging
					bind:this={viewEl}
					onclick={onViewClick}
					onpointerdown={onPointerDown}
					{@attach wheelZoom}
				>
					{#key ctl.key}
						<div
							class="board"
							class:won={ctl.won}
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
									{@const pending = pendingCells.has(i)}
									<div
										class="cell {v.cls}"
										class:pending
										data-i={i}
										role="gridcell"
										tabindex={i === focusCell ? 0 : -1}
										aria-label={pending ? 'Open spot' : v.label}
										style:--c={v.hex}
										class:alt={v.alt}
										style:--ink={v.ink}
									>
										{#if v.dot}
											<div
												class="gem"
												class:hl={hovered.has(i)}
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

				<div class="tray-area">
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<div
						class="tray"
						class:warn={trayState.warn}
						class:hidden={!!ctl.overlay}
						bind:this={trayEl}
						style:--n={trayView.length}
						style:--rows={trayRows}
						onclick={onTray}
						onpointermove={onTrayHover}
						onpointerleave={() => (trayHover = -1)}
					>
						{#each trayView as t, k (k)}
							<div class="slot" class:group-start={t.groupStart}>
								{#if t.g}
									<div class="gem {t.cls}" data-id={t.g.id} style:--c={t.hex}></div>
								{/if}
							</div>
						{/each}
					</div>
					{#if ctl.overlay}
						<LevelEnd
							{...ctl.end}
							text={ctl.overlay === 'win'
								? ctl.wonText('complete')
								: 'no group fits in the tray or in an open spot'}
						/>
					{/if}
				</div>
			</Card>
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
						onclick={() => zoomMiddle(1.6)}>+</button
					>
					<button
						class="zoom-btn border inset link-box"
						aria-label="Zoom out"
						title="Zoom out"
						disabled={!zoomed}
						onclick={() => zoomMiddle(1 / 1.6)}>&minus;</button
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
			<LevelNav {...ctl.nav} />
		</div>
	</div>

	<div class="fx" bind:this={fxEl} aria-hidden="true"></div>
</div>

<style>
	.mosaic {
		--muted: color-mix(in srgb, var(--text-color) 65%, var(--primary-color));

		box-sizing: border-box;
		width: 100%;
		/* Whole-pixel centering: the page's own centering can land on half a pixel. */
		padding-inline: max(0px, round(down, calc((100% - 1200px) / 2), 1px));
		/* Quick taps are moves, so a double tap must not zoom the page. */
		touch-action: manipulation;
		-webkit-tap-highlight-color: transparent;
		container-type: inline-size;
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
		--pad: 12px;
		--gap: 2px;
		--edges: calc(2 * (var(--pad) + var(--border-size)));
		--fit-w: calc((min(100cqw, 1000px) - var(--edges) - (var(--w) - 1) * var(--gap)) / var(--w));
		--fit-h: calc(
			/* svh stays steady while a phone's address bar comes and goes. */
			(max(100svh - 340px, 200px) - var(--edges) - (var(--h) - 1) * var(--gap)) / var(--h)
		);
		--cell: round(down, clamp(9px, min(var(--fit-w), var(--fit-h)), 44px), 1px);
		--slot: round(down, clamp(22px, calc(var(--cell) * 0.9), 36px), 1px);
		--dot: calc(var(--cell) - 2 * round(calc(var(--cell) * 0.2), 1px));
		--board-w: calc(var(--w) * var(--cell) + (var(--w) - 1) * var(--gap) + 2 * var(--pad));
		--board-h: calc(var(--h) * var(--cell) + (var(--h) - 1) * var(--gap) + 2 * var(--pad));

		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		margin-top: 14px;
	}
	@media (max-width: 500px) {
		.stage {
			--pad: 4px;
			--gap: 1px;
			--cell: round(down, clamp(9px, var(--fit-w), 44px), 1px);
		}
	}
	.board-wrap {
		--card-w: calc(var(--board-w) + 2 * var(--border-size));
		--inner-r: calc(10px - var(--border-size));
		--snap-w: var(--card-w);
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		width: var(--card-w);
		max-width: 100%;
	}

	.board {
		display: grid;
		grid-template-columns: repeat(var(--w), var(--cell));
		gap: var(--gap);
		padding: var(--pad);
		user-select: none;
		-webkit-user-select: none;
		transform-origin: 0 0;
	}
	.board-view {
		position: relative;
		overflow: hidden;
		width: var(--board-w);
		height: var(--board-h);
		touch-action: none;
		isolation: isolate;
		border-radius: var(--inner-r) var(--inner-r) 0 0;
	}
	.board-view.zoomed {
		cursor: grab;
	}
	.board-view.dragging {
		cursor: grabbing;
	}
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
	.cell.covered,
	.cell.open,
	.cell.filled {
		background: var(--c);
	}
	.cell.covered,
	.cell.open,
	.cell.pending {
		cursor: pointer;
	}
	.cell.open::after,
	.cell.pending::after {
		--shade: color-mix(in srgb, var(--c), var(--ink) 70%);
		--stripe: max(1px, round(calc(var(--cell) * 0.07), 1px));
		content: '';
		position: absolute;
		inset: round(calc(var(--cell) * 0.17), 1px);
		border-radius: 2px;
		rotate: 45deg;
		background: repeating-linear-gradient(
			var(--turn, 0deg),
			var(--shade) 0 var(--stripe),
			transparent var(--stripe) calc(var(--stripe) * 2 + 1px)
		);
	}
	.cell.alt::after {
		--turn: 90deg;
	}
	.cell.pending::after {
		inset: round(calc(var(--cell) * 0.2), 1px);
		border-radius: 50%;
		rotate: none;
		background: none;
		box-shadow: inset 0 0 0 max(1px, round(calc(var(--cell) * 0.08), 1px)) var(--shade);
	}
	.cell:focus-visible {
		box-shadow: inset 0 0 0 3px var(--accent-color);
	}
	.board.won .cell {
		border-radius: 0;
	}

	.gem,
	.fx :global(.flyer) {
		border-radius: 50%;
		background: var(--c);
		--ring: max(1px, round(calc(var(--cell) * 0.06), 1px));
		box-shadow: 0 0 0 var(--ring) rgb(0 0 0 / 0.45);
	}
	.fx :global(.flyer) {
		--ring: max(1px, round(calc(var(--slot) * 0.04), 1px));
	}
	.cell .gem {
		position: absolute;
		inset: round(calc(var(--cell) * 0.2), 1px);
		z-index: 1;
	}
	.gem.ghost {
		visibility: hidden;
	}
	.gem.hl {
		outline: max(2px, round(calc(var(--ring) * 1.5), 1px)) dashed var(--text-color);
		outline-offset: var(--ring);
	}
	.tray-area {
		--tray-gap: round(calc(var(--slot) * 0.14), 1px);
		--room: calc(var(--board-w) - 16px);
		display: grid;
		border-radius: 0 0 var(--inner-r) var(--inner-r);
	}
	.tray-area > :global(*) {
		grid-area: 1 / 1;
	}
	.tray {
		--pitch: calc(var(--slot) + var(--tray-gap));
		--fit-w: calc(round(down, calc(var(--room) + var(--tray-gap)), var(--pitch)) - var(--tray-gap));
		--row-w: min(var(--fit-w), calc(var(--n) * var(--pitch) - var(--tray-gap)));
		--pad: calc(8px + round(down, calc((var(--room) - var(--row-w)) / 2), 1px));
		display: flex;
		flex-wrap: wrap;
		gap: var(--tray-gap);
		padding: 8px var(--pad);
		cursor: default;
	}
	@supports (width: calc(sign(1px) * 1px)) {
		.tray {
			--row-w: var(--rows);
		}
	}
	.slot {
		width: var(--slot);
		height: var(--slot);
		border-radius: 50%;
		background: color-mix(in srgb, var(--text-color) 18%, transparent);
		position: relative;
	}
	.slot:empty::after {
		--shade: color-mix(in srgb, var(--text-color) 80%, transparent);
		--stripe: max(1px, round(calc(var(--slot) * 0.08), 1px));
		--side: calc(
			round(down, calc(var(--slot) * 0.5), calc(var(--stripe) * 2 + 1px)) + var(--stripe)
		);
		content: '';
		position: absolute;
		width: var(--side);
		height: var(--side);
		left: round(down, calc((var(--slot) - var(--side)) / 2), 1px);
		top: round(down, calc((var(--slot) - var(--side)) / 2), 1px);
		border-radius: 2px;
		rotate: 45deg;
		background: repeating-linear-gradient(
			var(--turn, 0deg),
			var(--shade) 0 var(--stripe),
			transparent var(--stripe) calc(var(--stripe) * 2 + 1px)
		);
	}
	.slot:nth-child(even)::after {
		--turn: 90deg;
	}
	.slot .gem {
		position: absolute;
		width: var(--dot);
		height: var(--dot);
		left: round(down, calc((var(--slot) - var(--dot)) / 2), 1px);
		top: round(down, calc((var(--slot) - var(--dot)) / 2), 1px);
	}
	.slot:has(.gem) {
		cursor: pointer;
	}
	.tray.warn .slot:empty::after {
		--shade: color-mix(in srgb, var(--accent-color) 80%, transparent);
	}
	.slot.group-start::before {
		--bar-h: round(calc(var(--slot) * 0.6), 1px);
		content: '';
		position: absolute;
		width: 1px;
		height: var(--bar-h);
		top: round(down, calc((var(--slot) - var(--bar-h)) / 2), 1px);
		left: calc(-1 * round(up, calc((var(--tray-gap) + 1px) / 2), 1px));
		background: color-mix(in srgb, var(--text-color) 35%, transparent);
		pointer-events: none;
	}
	.tray.hidden {
		visibility: hidden;
	}
	.board-wrap.nofit {
		--edge: var(--accent-color);
	}
	.nofit .tray-area {
		background: color-mix(in srgb, var(--accent-color) 22%, var(--primary-color));
		--ring: var(--text-color-st);
		box-shadow:
			inset 2px 0 var(--ring),
			inset -2px 0 var(--ring),
			inset 0 -2px var(--ring);
	}
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
	.fx :global(.flyer.waiting) {
		opacity: 0.45;
	}

	@media (max-width: 500px) {
		:global(body .content:has(> .mosaic)) {
			padding-left: 6px;
			padding-right: 6px;
		}
	}
</style>
