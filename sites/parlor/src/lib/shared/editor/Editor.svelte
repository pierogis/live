<!--
	The picture editor, shared by every game: paint pixels, pick colors, import an image,
	see the game's live checks, play-test, and save. The game comes in as `game` (see
	types.ts). On the dev server, "save to pack" writes straight into
	src/lib/<game>/levels/*.json; everywhere, a level can be downloaded or copied as JSON.
-->
<script lang="ts">
	import { onMount, untrack } from 'svelte';

	import * as G from './grid';
	import { quantize } from './quantize';
	import type { Check, EditorGame, Picture } from './types';
	import { MIN_DELTA, deltaE, lab } from '../palette';

	let { game }: { game: EditorGame } = $props();

	const PACKS = $derived(game.packs);
	const LEVELS = $derived(PACKS.flatMap((p) => p.levels));
	/** A level's own fields beyond its picture (like a game's tuning), kept as they were. */
	type Extras = Record<string, unknown>;

	type Tool = 'brush' | 'fill' | 'pick' | 'erase';
	interface Snapshot {
		grid: G.Grid;
		palette: Record<string, string>;
	}
	interface Draft {
		id: string;
		name: string;
		palette: Record<string, string>;
		art: string[];
		pack: string;
		/** The pack and id this draft was loaded from or last saved as. */
		origin: { pack: string; id: string } | null;
	}

	const DRAFT_KEY = untrack(() => `parlor:editor:${game.id}`);
	const NOTE_KEY = `${DRAFT_KEY}:note`;
	const DEV = import.meta.env.DEV;
	const PRESETS = [
		'#e63946',
		'#ff9f43',
		'#ffd23f',
		'#2e7d32',
		'#7bd389',
		'#1d8fa8',
		'#3b7dd8',
		'#9b5de5',
		'#ff7eb6',
		'#7a4a26',
		'#ffffff',
		'#1c2340',
		'#a8dcff',
		'#f2c46d'
	];
	const TOOLS: { tool: Tool; key: string; label: string }[] = [
		{ tool: 'brush', key: 'b', label: 'brush' },
		{ tool: 'fill', key: 'f', label: 'fill' },
		{ tool: 'pick', key: 'i', label: 'pick' },
		{ tool: 'erase', key: 'e', label: 'erase' }
	];

	let name = $state('');
	let id = $state('');
	/** Whether the id follows the name (true until you type an id yourself). */
	let idFromName = $state(true);
	let palette: Record<string, string> = $state({});
	let grid: G.Grid = $state.raw(G.blank(24, 20));
	let pack = $state(untrack(() => game.packs[0]?.id ?? '01-new'));
	let extras: Extras = $state.raw({});
	let newPackName = $state('');
	let origin: Draft['origin'] = $state(null);
	let brush = $state('A');
	let tool: Tool = $state('brush');
	let sizeW = $state(24);
	let sizeH = $state(20);
	let message = $state('');
	let saving = $state(false);
	let playing = $state(false);
	let loaded = $state(false);
	let hoverCell = $state(-1);

	let undoStack: Snapshot[] = $state.raw([]);
	let redoStack: Snapshot[] = $state.raw([]);

	let importing = $state(false);
	let importWidth = $state(24);
	let importColors = $state(6);
	let importSharp = $state(false);
	let importDespeckle = $state(true);
	let fileInput: HTMLInputElement | undefined = $state();

	let canvas: HTMLCanvasElement | undefined = $state();
	let stageWidth = $state(600);

	// ---------- the level as the game sees it ----------
	const draft: Picture = $derived({
		...extras,
		id,
		name,
		palette: $state.snapshot(palette),
		art: G.toArt(grid)
	});

	const packNames = $derived(new Map(PACKS.map((p) => [p.id, p.name])));
	const isNewPack = $derived(!packNames.has(pack));

	/** Where this level sits in play order: its place if it's saved, else the end of its pack. */
	const slot = $derived.by(() => {
		let index = 0;
		for (const p of PACKS) {
			if (origin && p.id === origin.pack && origin.pack === pack) {
				const at = p.levels.findIndex((l) => l.id === origin!.id);
				if (at >= 0) return index + at;
			}
			index += p.levels.length;
			if (p.id === pack) return index;
		}
		return index;
	});

	/** Every level in play order, with this draft in its slot: what play-testing uses. */
	const playLevels = $derived.by(() => {
		const list = LEVELS.slice();
		const replacing = origin && origin.pack === pack && LEVELS[slot]?.id === origin.id;
		list.splice(slot, replacing ? 1 : 0, draft);
		return list;
	});

	let report = $state.raw<Check | null>(null);
	let checking = $state(false);
	$effect(() => {
		const lv = draft;
		const at = slot;
		checking = true;
		const timer = setTimeout(() => {
			try {
				report = game.check(lv, at);
			} catch (err) {
				report = null;
				message = `Check failed: ${err}`;
			}
			checking = false;
		}, 250);
		return () => clearTimeout(timer);
	});
	const playable = $derived(!!report && !checking && !report.problems.length);

	const counts = $derived.by(() => {
		const out: Record<string, number> = {};
		for (const c of grid.cells) out[c] = (out[c] || 0) + 1;
		return out;
	});

	/** For each color, the colors that look too much like it. */
	const lookAlikes = $derived.by(() => {
		const out: Record<string, string[]> = {};
		const keys = Object.keys(palette);
		for (const a of keys) {
			out[a] = keys.filter((b) => b !== a && deltaE(lab(palette[a]), lab(palette[b])) < MIN_DELTA);
		}
		return out;
	});

	// ---------- history ----------
	function snapshot(): Snapshot {
		return { grid, palette: $state.snapshot(palette) };
	}

	function remember() {
		undoStack = [...undoStack.slice(-199), snapshot()];
		redoStack = [];
	}

	function restore(s: Snapshot) {
		grid = s.grid;
		palette = { ...s.palette };
		sizeW = grid.w;
		sizeH = grid.h;
		if (!(brush in palette)) brush = Object.keys(palette)[0] ?? 'A';
	}

	function undo() {
		const s = undoStack.at(-1);
		if (!s) return;
		redoStack = [...redoStack, snapshot()];
		undoStack = undoStack.slice(0, -1);
		restore(s);
	}

	function redo() {
		const s = redoStack.at(-1);
		if (!s) return;
		undoStack = [...undoStack, snapshot()];
		redoStack = redoStack.slice(0, -1);
		restore(s);
	}

	// ---------- loading ----------
	function load(lv: Picture, from: Draft['origin'], packId: string) {
		// Keep a level's own fields; a measured win rate is stale once the picture changes.
		const {
			id: _id,
			name: _name,
			palette: _palette,
			art: _art,
			wins: _wins,
			...rest
		} = lv as Picture & Extras;
		void [_id, _name, _palette, _art, _wins];
		extras = rest;
		name = lv.name;
		id = lv.id;
		idFromName = !from;
		palette = { ...lv.palette };
		grid = G.fromArt(lv.art);
		sizeW = grid.w;
		sizeH = grid.h;
		origin = from;
		pack = packId;
		brush = Object.keys(palette)[1] ?? Object.keys(palette)[0] ?? 'A';
		undoStack = [];
		redoStack = [];
	}

	function openLevel(value: string) {
		if (value === 'new') return newLevel();
		const [packId, levelId] = value.split('/');
		const lv = PACKS.find((p) => p.id === packId)?.levels.find((l) => l.id === levelId);
		if (lv) {
			load(lv, { pack: packId, id: levelId }, packId);
			message = `Editing ${lv.name}.`;
		}
	}

	function newLevel() {
		const last = PACKS.at(-1)?.id ?? '01-new';
		load(
			{
				id: '',
				name: '',
				palette: { A: '#a8dcff', B: '#e63946' },
				art: G.toArt(G.blank(24, 20, 'A'))
			},
			null,
			last
		);
		message = 'New level. Paint with B, or import an image.';
	}

	// ---------- painting ----------
	const cellPx = $derived(
		Math.max(8, Math.min(32, Math.floor((stageWidth - 2) / grid.w), Math.floor(560 / grid.h)))
	);

	$effect(() => {
		const ctx = canvas?.getContext('2d');
		if (!canvas || !ctx) return;
		const px = cellPx;
		canvas.width = grid.w * px;
		canvas.height = grid.h * px;
		const style = getComputedStyle(canvas);
		const checkA = style.getPropertyValue('--check-a').trim() || '#ddd';
		const checkB = style.getPropertyValue('--check-b').trim() || '#eee';
		for (let i = 0; i < grid.cells.length; i++) {
			const x = (i % grid.w) * px;
			const y = Math.floor(i / grid.w) * px;
			const k = grid.cells[i];
			if (k === '.' || !palette[k]) {
				const half = px / 2;
				ctx.fillStyle = checkA;
				ctx.fillRect(x, y, px, px);
				ctx.fillStyle = checkB;
				ctx.fillRect(x, y, half, half);
				ctx.fillRect(x + half, y + half, half, half);
			} else {
				ctx.fillStyle = palette[k];
				ctx.fillRect(x, y, px, px);
			}
		}
		// Faint grid lines once cells are big enough to see them.
		if (px >= 12) {
			ctx.fillStyle = 'rgb(0 0 0 / 0.12)';
			for (let x = 1; x < grid.w; x++) ctx.fillRect(x * px, 0, 1, grid.h * px);
			for (let y = 1; y < grid.h; y++) ctx.fillRect(0, y * px, grid.w * px, 1);
		}
		if (hoverCell >= 0 && hoverCell < grid.cells.length) {
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 2;
			ctx.strokeRect(
				(hoverCell % grid.w) * px + 1,
				Math.floor(hoverCell / grid.w) * px + 1,
				px - 2,
				px - 2
			);
			ctx.strokeStyle = '#fff';
			ctx.lineWidth = 1;
			ctx.strokeRect(
				(hoverCell % grid.w) * px + 2.5,
				Math.floor(hoverCell / grid.w) * px + 2.5,
				px - 5,
				px - 5
			);
		}
	});

	let stroke: { last: number } | null = null;

	function cellAt(e: PointerEvent): number {
		const r = canvas!.getBoundingClientRect();
		const x = Math.floor(((e.clientX - r.left) / r.width) * grid.w);
		const y = Math.floor(((e.clientY - r.top) / r.height) * grid.h);
		if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return -1;
		return y * grid.w + x;
	}

	/** Paint every cell on the line from a to b, so fast strokes leave no gaps. */
	function paintLine(a: number, b: number, key: string) {
		const cells = grid.cells.slice();
		let x0 = a % grid.w;
		let y0 = Math.floor(a / grid.w);
		const x1 = b % grid.w;
		const y1 = Math.floor(b / grid.w);
		const dx = Math.abs(x1 - x0);
		const dy = -Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx + dy;
		for (;;) {
			cells[y0 * grid.w + x0] = key;
			if (x0 === x1 && y0 === y1) break;
			const e2 = 2 * err;
			if (e2 >= dy) {
				err += dy;
				x0 += sx;
			}
			if (e2 <= dx) {
				err += dx;
				y0 += sy;
			}
		}
		grid = { ...grid, cells };
	}

	function pick(i: number) {
		const k = grid.cells[i];
		if (k !== '.' && k in palette) {
			brush = k;
			tool = 'brush';
		}
	}

	function onPointerDown(e: PointerEvent) {
		const i = cellAt(e);
		if (i < 0 || e.button > 0) return;
		e.preventDefault();
		if (tool === 'pick' || e.altKey) return pick(i);
		remember();
		if (tool === 'fill') {
			grid = G.fill(grid, i, brush);
			return;
		}
		canvas!.setPointerCapture(e.pointerId);
		stroke = { last: i };
		paintLine(i, i, tool === 'erase' ? '.' : brush);
	}

	function onPointerMove(e: PointerEvent) {
		const i = cellAt(e);
		hoverCell = e.pointerType === 'mouse' ? i : -1;
		if (!stroke || i < 0 || i === stroke.last) return;
		paintLine(stroke.last, i, tool === 'erase' ? '.' : brush);
		stroke.last = i;
	}

	function onPointerUp() {
		stroke = null;
	}

	// ---------- palette ----------
	function addColor() {
		const k = G.nextKey(palette);
		if (!k) return;
		remember();
		// The preset that stands out most from the colors already there.
		const labs = Object.values(palette).map(lab);
		const far = (hex: string) => Math.min(Infinity, ...labs.map((l) => deltaE(l, lab(hex))));
		palette[k] = [...PRESETS].sort((a, b) => far(b) - far(a))[0];
		brush = k;
	}

	function removeColor(k: string) {
		remember();
		grid = G.replaceAll(grid, k, '.');
		delete palette[k];
		if (brush === k) brush = Object.keys(palette)[0] ?? 'A';
	}

	/** Recolor every pixel of `from` as `to`, then drop `from`. */
	function mergeColor(from: string, to: string) {
		remember();
		grid = G.replaceAll(grid, from, to);
		delete palette[from];
		if (brush === from) brush = to;
	}

	// ---------- size ----------
	function applySize() {
		const w = Math.max(4, Math.min(48, Math.round(sizeW)));
		const h = Math.max(4, Math.min(48, Math.round(sizeH)));
		if (w === grid.w && h === grid.h) return;
		remember();
		grid = G.resize(grid, w, h, '.');
		sizeW = w;
		sizeH = h;
	}

	function transform(fn: (g: G.Grid) => G.Grid) {
		remember();
		grid = fn(grid);
	}

	// ---------- image import ----------
	async function importImage(file: File) {
		try {
			const bitmap = await createImageBitmap(file);
			const w = Math.max(4, Math.min(48, Math.round(importWidth)));
			const h = Math.max(4, Math.min(48, Math.round((w * bitmap.height) / bitmap.width)));
			// Halve in steps first, so a big photo averages smoothly instead of aliasing.
			let src: CanvasImageSource = bitmap;
			let sw = bitmap.width;
			let sh = bitmap.height;
			if (!importSharp) {
				while (sw / 2 > w * 2 && sh / 2 > h * 2) {
					const step = new OffscreenCanvas(Math.round(sw / 2), Math.round(sh / 2));
					const sctx = step.getContext('2d')!;
					sctx.imageSmoothingQuality = 'high';
					sctx.drawImage(src, 0, 0, step.width, step.height);
					src = step;
					sw = step.width;
					sh = step.height;
				}
			}
			const out = new OffscreenCanvas(w, h);
			const ctx = out.getContext('2d')!;
			ctx.imageSmoothingEnabled = !importSharp;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(src, 0, 0, w, h);
			const { data } = ctx.getImageData(0, 0, w, h);
			const q = quantize(data, w, h, {
				colors: importColors,
				despeckle: importDespeckle ? 1 : 0
			});
			if (Object.keys(q.palette).length < 2) {
				message = 'That image came out as one color. Try more colors or a bigger width.';
				return;
			}
			// An import is always a new level, so saving it can't overwrite the one that was open.
			const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
			load(
				{ id: G.slug(title), name: title, palette: q.palette, art: q.art },
				null,
				PACKS.at(-1)?.id ?? pack
			);
			brush = Object.keys(q.palette)[0];
			importing = false;
			message = `Imported ${file.name} as a new level: ${w}x${h}, ${Object.keys(q.palette).length} colors.`;
		} catch (err) {
			message = `Couldn't read that image: ${err}`;
		}
	}

	// ---------- saving ----------
	function levelJson() {
		return JSON.stringify(draft, null, '\t');
	}

	async function save() {
		if (!report || report.problems.length) {
			message = 'Fix the problems first.';
			return;
		}
		saving = true;
		// Writing the pack file makes the dev server reload the page, sometimes before the
		// reply arrives. So record the save first; it's put back if the save fails.
		const before = { origin, idFromName };
		const target = { pack, id };
		const replaces = origin && origin.pack === pack ? origin.id : undefined;
		origin = target;
		idFromName = false;
		persistDraft(`Saved to ${game.id}/levels/${pack}.json.`);
		try {
			const res = await fetch('/__levels/save', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					game: game.id,
					pack,
					packName: newPackName || pack,
					level: draft,
					replaces
				})
			});
			const body = await res.json();
			if (!res.ok) throw new Error(body.error);
			message = `Saved to ${game.id}/levels/${pack}.json.`;
		} catch (err) {
			origin = before.origin;
			idFromName = before.idFromName;
			persistDraft();
			try {
				sessionStorage.removeItem(NOTE_KEY);
			} catch {
				/* storage blocked */
			}
			message = `Couldn't save: ${err instanceof Error ? err.message : err}`;
		} finally {
			saving = false;
		}
	}

	function download() {
		const url = URL.createObjectURL(new Blob([levelJson() + '\n'], { type: 'application/json' }));
		const a = document.createElement('a');
		a.href = url;
		a.download = `${id || 'level'}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(levelJson());
			message = 'Copied the level as JSON.';
		} catch {
			message = "Couldn't copy. Use Download instead.";
		}
	}

	// ---------- keys ----------
	function onKey(e: KeyboardEvent) {
		if (playing) return;
		if ((e.target as Element).closest?.('input, textarea, select')) return;
		const key = e.key.toLowerCase();
		if (e.metaKey || e.ctrlKey) {
			if (key === 'z') {
				e.preventDefault();
				if (e.shiftKey) redo();
				else undo();
			} else if (key === 'y') {
				e.preventDefault();
				redo();
			}
			return;
		}
		const t = TOOLS.find((x) => x.key === key);
		if (t) tool = t.tool;
		const n = Number(e.key);
		if (n >= 1 && n <= 9) {
			const k = Object.keys(palette)[n - 1];
			if (k) brush = k;
		}
	}

	// ---------- the draft survives reloads ----------
	/** Save the draft for reloads; `note` is shown once after the next reload. */
	function persistDraft(note?: string) {
		const keep = { ...draft, pack, origin, extras };
		try {
			localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...keep, idFromName, newPackName }));
			if (note) sessionStorage.setItem(NOTE_KEY, note);
		} catch {
			/* storage blocked: the draft just won't survive a reload */
		}
	}

	$effect(() => {
		if (!loaded) return;
		void draft;
		void pack;
		void origin;
		void newPackName;
		const timer = setTimeout(() => persistDraft(), 300);
		return () => clearTimeout(timer);
	});

	onMount(() => {
		let restored = false;
		try {
			const raw = localStorage.getItem(DRAFT_KEY);
			const d = raw && JSON.parse(raw);
			if (d && Array.isArray(d.art) && d.art.length && d.palette) {
				load(d, d.origin ?? null, d.pack ?? pack);
				extras = d.extras ?? {};
				idFromName = !!d.idFromName;
				newPackName = d.newPackName ?? '';
				restored = true;
				message = sessionStorage.getItem(NOTE_KEY) || 'Picked up where you left off.';
				sessionStorage.removeItem(NOTE_KEY);
			}
		} catch {
			/* no saved draft */
		}
		if (!restored) {
			const first = PACKS[0]?.levels[0];
			if (first) load(first, { pack: PACKS[0].id, id: first.id }, PACKS[0].id);
			else newLevel();
		}
		loaded = true;
	});

	const Play = $derived(game.play);

	const nextPackId = $derived.by(() => {
		const n = PACKS.length + 1;
		return `${String(n).padStart(2, '0')}-${G.slug(newPackName) || 'new-pack'}`;
	});
</script>

<svelte:document onkeydown={onKey} />

<div class="editor">
	<div class="bar">
		<div class="titles">
			<h2 class="brand">{game.id} editor</h2>
			<div class="sub">
				{name || 'Untitled'} · {grid.w}x{grid.h}
				{#if origin}· levels/{origin.pack}.json{:else}· not saved yet{/if}
			</div>
		</div>
		<label class="open">
			<span class="sr">Open a level</span>
			<select
				value={origin ? `${origin.pack}/${origin.id}` : 'new'}
				onchange={(e) => openLevel(e.currentTarget.value)}
			>
				<option value="new">New level</option>
				{#each PACKS as p (p.id)}
					<optgroup label={p.name}>
						{#each p.levels as lv (lv.id)}
							<option value="{p.id}/{lv.id}">{lv.name}</option>
						{/each}
					</optgroup>
				{/each}
			</select>
		</label>
		<button class="btn border inset link-box" onclick={newLevel}>new</button>
		<button
			class="btn border inset link-box"
			onclick={() => (importing = !importing)}
			aria-expanded={importing}
		>
			import image
		</button>
		<button class="btn border inset link-box" disabled={!playable} onclick={() => (playing = true)}
			>play-test</button
		>
	</div>

	{#if importing}
		<div class="panel inset import">
			<label>width <input type="number" min="4" max="48" bind:value={importWidth} /></label>
			<label>colors <input type="number" min="2" max="16" bind:value={importColors} /></label>
			<label class="check"
				><input type="checkbox" bind:checked={importSharp} /> Pixel art (keep hard edges)</label
			>
			<label class="check"
				><input type="checkbox" bind:checked={importDespeckle} /> Clean up lone pixels</label
			>
			<button class="btn border inset link-box" onclick={() => fileInput?.click()}
				>choose image…</button
			>
			<input
				class="sr"
				type="file"
				accept="image/*"
				bind:this={fileInput}
				onchange={(e) => {
					const f = e.currentTarget.files?.[0];
					if (f) importImage(f);
					e.currentTarget.value = '';
				}}
			/>
			<p class="hint">
				The height follows the image's shape. Similar colors are merged until every pair is easy to
				tell apart, so you may get fewer colors than you asked for. Use images you have the rights
				to.
			</p>
		</div>
	{/if}

	{#if message}<p class="message" aria-live="polite">{message}</p>{/if}

	<div class="layout">
		<aside class="panel inset tools-panel">
			<h3>tools</h3>
			<div class="tools">
				{#each TOOLS as t (t.tool)}
					<button
						class="tool inset"
						class:on={tool === t.tool}
						aria-pressed={tool === t.tool}
						title="{t.label} ({t.key.toUpperCase()})"
						onclick={() => (tool = t.tool)}>{t.label}</button
					>
				{/each}
			</div>
			<div class="tools">
				<button class="tool inset" disabled={!undoStack.length} onclick={undo} title="Undo (Ctrl+Z)"
					>undo</button
				>
				<button
					class="tool inset"
					disabled={!redoStack.length}
					onclick={redo}
					title="Redo (Ctrl+Shift+Z)">redo</button
				>
			</div>

			<h3>colors</h3>
			<ul class="palette">
				{#each Object.keys(palette) as k, n (k)}
					<li class:on={brush === k} class:bad={lookAlikes[k]?.length}>
						<button
							class="swatch-pick"
							aria-label="Paint with {k}"
							aria-pressed={brush === k}
							title={n < 9 ? `Paint with ${k} (${n + 1})` : `Paint with ${k}`}
							onclick={() => {
								brush = k;
								if (tool === 'erase' || tool === 'pick') tool = 'brush';
							}}
						>
							<span class="key">{k}</span>
							<span class="count">{counts[k] || 0}</span>
						</button>
						<input
							type="color"
							aria-label="Color {k}"
							value={palette[k]}
							onfocus={remember}
							oninput={(e) => (palette[k] = e.currentTarget.value)}
						/>
						<button
							class="x"
							aria-label="Remove {k}"
							title="Remove (its pixels become empty)"
							onclick={() => removeColor(k)}>×</button
						>
						{#if lookAlikes[k]?.length}
							<div class="alike">
								looks like {#each lookAlikes[k] as other (other)}
									<button
										class="link"
										title="Repaint {k} as {other}"
										onclick={() => mergeColor(k, other)}>{other}</button
									>
								{/each}
								<span class="tip">(tap one to merge {k} into it)</span>
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			<button
				class="btn small border inset link-box"
				onclick={addColor}
				disabled={!G.nextKey(palette)}>+ color</button
			>
			<p class="hint">
				Alt-click a pixel to pick its color. Empty pixels are left out of the picture.
			</p>
		</aside>

		<section class="stage" bind:clientWidth={stageWidth}>
			<canvas
				bind:this={canvas}
				class="paint"
				class:picking={tool === 'pick'}
				style:width="{grid.w * cellPx}px"
				style:height="{grid.h * cellPx}px"
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointercancel={onPointerUp}
				onpointerleave={() => (hoverCell = -1)}
				oncontextmenu={(e) => e.preventDefault()}
			></canvas>
			<div class="stage-tools">
				<button class="tool inset" onclick={() => transform(G.flip)} title="Mirror left to right"
					>mirror</button
				>
				<button
					class="tool inset"
					onclick={() => transform((g) => G.shift(g, -1, 0))}
					aria-label="Shift left">←</button
				>
				<button
					class="tool inset"
					onclick={() => transform((g) => G.shift(g, 1, 0))}
					aria-label="Shift right">→</button
				>
				<button
					class="tool inset"
					onclick={() => transform((g) => G.shift(g, 0, -1))}
					aria-label="Shift up">↑</button
				>
				<button
					class="tool inset"
					onclick={() => transform((g) => G.shift(g, 0, 1))}
					aria-label="Shift down">↓</button
				>
				<span class="cursor">
					{#if hoverCell >= 0}
						x {hoverCell % grid.w}, y {Math.floor(hoverCell / grid.w)} · {grid.cells[hoverCell]}
					{/if}
				</span>
			</div>
		</section>

		<aside class="panel inset info">
			<h3>level</h3>
			<label
				>name <input
					value={name}
					oninput={(e) => {
						name = e.currentTarget.value;
						if (idFromName) id = G.slug(name);
					}}
				/></label
			>
			<label
				>id <input
					value={id}
					oninput={(e) => {
						id = G.slug(e.currentTarget.value);
						idFromName = false;
					}}
				/></label
			>
			{#if origin && origin.id !== id}
				<p class="hint warn">A new id changes how this level is dealt.</p>
			{/if}
			<label>
				pack
				<select bind:value={pack}>
					{#each PACKS as p (p.id)}
						<option value={p.id}>{p.name} ({p.id})</option>
					{/each}
					<option value={nextPackId}
						>{isNewPack ? `${newPackName || 'New pack'} (new)` : 'New pack…'}</option
					>
				</select>
			</label>
			{#if isNewPack}
				<label
					>new pack name <input
						value={newPackName}
						oninput={(e) => {
							newPackName = e.currentTarget.value;
							pack = nextPackId;
						}}
					/></label
				>
			{/if}
			<div class="size">
				<label>w <input type="number" min="4" max="48" bind:value={sizeW} /></label>
				<label>h <input type="number" min="4" max="48" bind:value={sizeH} /></label>
				<button
					class="btn small border inset link-box"
					onclick={applySize}
					disabled={sizeW === grid.w && sizeH === grid.h}>resize</button
				>
			</div>

			<h3>
				checks {#if checking}<span class="muted">· checking…</span>{/if}
			</h3>
			{#if report}
				{#if report.problems.length}
					<ul class="issues bad">
						{#each report.problems as p (p)}<li>{p}</li>{/each}
					</ul>
				{:else}
					<p class="ok">{report.summary}</p>
				{/if}
				{#if report.warnings.length}
					<ul class="issues">
						{#each report.warnings as w (w)}<li>{w}</li>{/each}
					</ul>
				{/if}
				{#if !report.problems.length}
					<dl class="stats">
						{#each report.stats as stat (stat.label)}
							<dt>{stat.label}</dt>
							<dd>{stat.value}</dd>
						{/each}
						<dt>play order</dt>
						<dd>#{slot + 1}</dd>
					</dl>
				{/if}
			{/if}

			<h3>save</h3>
			<div class="save">
				{#if DEV}
					<button class="btn border inset link-box" disabled={!playable || saving} onclick={save}>
						{saving ? 'saving…' : 'save to pack'}
					</button>
				{/if}
				<button class="btn border inset link-box" onclick={download}>download</button>
				<button class="btn border inset link-box" onclick={copy}>copy JSON</button>
			</div>
			{#if !DEV}
				<p class="hint">
					Saving into the game's packs works on the dev server (pnpm -F parlor dev).
				</p>
			{/if}
		</aside>
	</div>
</div>

{#if playing}
	<div class="play" role="dialog" aria-modal="true" aria-label="Play-test">
		<div class="play-bar">
			<button class="btn border inset link-box" onclick={() => (playing = false)}
				>← back to editing</button
			>
			<span class="muted">Play-test: progress isn't saved.</span>
		</div>
		<Play levels={playLevels} start={slot} sandbox />
	</div>
{/if}

<style>
	.editor,
	.play {
		--bg: var(--primary-color);
		--panel: var(--primary-color);
		--ink: var(--text-color);
		--muted: color-mix(in srgb, var(--text-color) 70%, var(--primary-color));
		--line: var(--text-color-st);
		--accent: var(--accent-color);
		--bad: var(--accent-color);
		--good: var(--link-color);
		--check-a: color-mix(in srgb, var(--text-color) 10%, var(--primary-color));
		--check-b: color-mix(in srgb, var(--text-color) 4%, var(--primary-color));
	}
	.editor {
		width: 100%;
		max-width: 1300px;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.bar {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}
	.titles {
		flex: 1;
		min-width: 180px;
	}
	.brand {
		margin: 0;
		font-size: 20px;
	}
	.sub,
	.muted,
	.hint {
		color: var(--muted);
		font-size: 13px;
	}
	.hint {
		margin: 6px 0 0;
	}
	.hint.warn {
		color: var(--bad);
	}
	.layout {
		display: grid;
		grid-template-columns: 220px minmax(0, 1fr) 280px;
		gap: 12px;
		align-items: start;
	}
	@media (max-width: 900px) {
		.layout {
			grid-template-columns: 1fr;
		}
		.stage {
			order: -1;
		}
	}
	.panel {
		background: var(--panel);
		border-radius: 10px;
		padding: 12px;
	}
	h3 {
		margin: 12px 0 6px;
		font-size: 14px;
	}
	h3:first-child {
		margin-top: 0;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 13px;
		margin-bottom: 8px;
	}
	label.check {
		flex-direction: row;
		align-items: center;
		gap: 6px;
	}
	input:not([type='checkbox']):not([type='color']),
	select {
		background: var(--input-color);
		color: var(--text-color);
		border-radius: 10px;
		box-shadow: var(--inset);
		padding: 6px 8px;
		width: 100%;
	}
	.open select {
		min-width: 180px;
	}
	.open {
		margin: 0;
	}
	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
	}
	/* Buttons use the site's border inset link-box; tool chips use its inset ring. */
	.btn:disabled,
	.tool:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.btn.small {
		font-size: 13px;
	}
	.tool {
		border-radius: 10px;
		background: var(--panel);
		cursor: pointer;
		font-family: Courier, monospace;
		font-weight: 700;
	}
	.tool:focus-visible,
	.swatch-pick:focus-visible,
	.x:focus-visible {
		box-shadow: 0 0 0 3px var(--accent);
	}
	.message {
		margin: 0;
		color: var(--muted);
	}
	.import {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 12px;
	}
	.import label {
		margin: 0;
	}
	.import input[type='number'] {
		width: 80px;
	}
	.import .hint {
		flex-basis: 100%;
	}
	.tools,
	.stage-tools,
	.save {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 6px;
	}
	.tool {
		padding: 6px 10px;
		font-size: 13px;
	}
	.tool.on {
		background: var(--ink);
		color: var(--bg);
		box-shadow: none;
	}
	.palette {
		list-style: none;
		margin: 0 0 8px;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.palette li {
		display: grid;
		grid-template-columns: 1fr 44px 28px;
		align-items: center;
		gap: 4px;
		padding: 4px;
		border-radius: 10px;
	}
	.palette li.on {
		box-shadow: inset 0 0 0 2px var(--ink);
	}
	.palette li.bad {
		background: color-mix(in srgb, var(--bad) 14%, transparent);
	}
	.swatch-pick {
		display: flex;
		justify-content: space-between;
		background: transparent;
		padding: 4px 6px;
		border-radius: 8px;
		cursor: pointer;
	}
	.key {
		font-family: 'Courier', monospace;
		font-weight: 700;
	}
	.count {
		color: var(--muted);
		font-size: 12px;
	}
	input[type='color'] {
		width: 44px;
		height: 28px;
		padding: 0;
		background: none;
		cursor: pointer;
	}
	.x {
		background: transparent;
		padding: 0;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		cursor: pointer;
		font-size: 18px;
		line-height: 1;
	}
	.alike {
		grid-column: 1 / -1;
		font-size: 12px;
		color: var(--bad);
		padding: 0 6px 2px;
	}
	.link {
		background: none;
		padding: 0 2px;
		margin-right: 4px;
		text-decoration: underline;
		color: var(--bad);
		cursor: pointer;
		font-family: 'Courier', monospace;
		font-weight: 700;
	}
	.tip {
		color: var(--muted);
	}
	.stage {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}
	.paint {
		display: block;
		touch-action: none;
		image-rendering: pixelated;
		border-radius: 6px;
		box-shadow: 0 0 0 2px var(--line);
		cursor: crosshair;
	}
	.paint.picking {
		cursor: copy;
	}
	.cursor {
		align-self: center;
		font-size: 12px;
		color: var(--muted);
		font-family: 'Courier', monospace;
		min-width: 12ch;
	}
	.size {
		display: flex;
		gap: 6px;
		align-items: flex-end;
	}
	.size label {
		margin: 0;
		flex: 1;
	}
	.ok {
		color: var(--good);
		margin: 0 0 6px;
		font-weight: 600;
	}
	.issues {
		margin: 0 0 8px;
		padding-left: 18px;
		font-size: 13px;
	}
	.issues.bad {
		color: var(--bad);
		font-weight: 600;
	}
	.stats {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 2px 10px;
		margin: 0;
		font-size: 13px;
	}
	.stats dt {
		color: var(--muted);
	}
	.stats dd {
		margin: 0;
		/* the site styles make dd a list item */
		display: block;
	}
	.play {
		position: fixed;
		inset: 0;
		z-index: 200;
		overflow: auto;
		background: var(--bg);
		padding: 12px 16px 24px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.play-bar {
		width: 100%;
		max-width: 1200px;
		display: flex;
		align-items: center;
		gap: 12px;
	}
</style>
