// Generate Mosaic level pictures from drawn templates, seeded, so the packs can be rebuilt:
//   pnpm -F parlor mosaic:pictures [--out <dir>] [--sheet <file.png>] [--only <template>] [--dry]
// Every picture is original: scenes and objects drawn from big flat shapes (scripts/mosaic/).
// Play goes from small, simple pictures in 5 colors after the hand-drawn first pack to
// 36-cell pictures in about 12 colors at level 200, with more and smaller parts as it goes.
// Writes src/lib/mosaic/levels/NN-<name>.json for packs 02 onward (01 is hand-drawn), or
// into `--out <dir>` instead. `--sheet` also draws every Mosaic picture into one PNG;
// `--only fox` draws just that template, at several points in play, for a quick look;
// `--dry` writes no packs.
import { readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';

import { reportLevel } from '../src/lib/mosaic/report.ts';
import { slug } from '../src/lib/shared/editor/grid.ts';
import { hashStr, makeRng } from '../src/lib/shared/engine.ts';
import type { Picture } from '../src/lib/shared/level.ts';
import { Canvas } from './mosaic/canvas.ts';
import { CREATURES } from './mosaic/creatures.ts';
import { sheet } from './mosaic/png.ts';
import { SCENES } from './mosaic/scenes.ts';
import { THINGS } from './mosaic/things.ts';
import type { Template } from './mosaic/backdrop.ts';
import { writePack } from './write-pack.ts';

const { values: args } = parseArgs({
	options: {
		out: { type: 'string' },
		sheet: { type: 'string' },
		only: { type: 'string' },
		dry: { type: 'boolean' }
	}
});
const DIR = new URL('../src/lib/mosaic/levels/', import.meta.url);
const OUT = args.out ? pathToFileURL(`${args.out.replace(/\/$/, '')}/`) : DIR;

/** All of Mosaic's levels: the hand-drawn first pack, then these. */
const TOTAL = 200;
const FIRST = JSON.parse(readFileSync(new URL('01-first-light.json', DIR), 'utf8')) as {
	levels: Picture[];
};
const START = FIRST.levels.length;

const PACKS = [
	'Morning Walk',
	'Salt Air',
	'Market Day',
	'Golden Hour',
	'Long Shadows',
	'Lantern Light',
	'Far Shores',
	'Northern Lights'
];

const TEMPLATES: Template[] = [...SCENES, ...CREATURES, ...THINGS];

/** Size and colors for play index `i`: about 22 across in 5 colors, up to 36 in 12. */
function plan(i: number, aspect: number) {
	const s = Math.max(0, (i - START) / (TOTAL - 1 - START));
	const area = 480 + (1200 - 480) * s;
	let w = Math.round(Math.sqrt(area * aspect));
	let h = Math.round(area / w);
	if (w > 36) [w, h] = [36, Math.round(area / 36)];
	if (h > 36) [w, h] = [Math.round(area / 36), 36];
	w = Math.max(18, Math.min(36, w));
	h = Math.max(18, Math.min(36, h));
	const colors = Math.round(5 + 7 * s);
	return { w, h, colors, t: s };
}

/** Which template each new level uses: each one's repeats spread evenly over play. */
function order(n: number): { tpl: Template; use: number }[] {
	const rng = makeRng(hashStr('mosaic-order'));
	const per = Math.floor(n / TEMPLATES.length);
	let extra = n - per * TEMPLATES.length;
	const slots: { tpl: Template; use: number; at: number }[] = [];
	const shuffled = TEMPLATES.slice().sort(() => rng() - 0.5);
	for (const tpl of shuffled) {
		const uses = Math.min(tpl.max ?? 4, per + (extra > 0 ? 1 : 0));
		if (uses > per) extra--;
		const off = rng();
		for (let u = 0; u < uses; u++) slots.push({ tpl, use: u, at: (u + off) / uses + rng() * 0.04 });
	}
	return slots.sort((a, b) => a.at - b.at).slice(0, n);
}

/**
 * The most of the picture one color may cover. Past half, some dots must start on their
 * own color; a little under keeps the scramble free to move every dot.
 */
const MAX_SHARE = 0.45;
function topShare(art: string[]): number {
	const counts = new Map<string, number>();
	for (const row of art) for (const ch of row) counts.set(ch, (counts.get(ch) ?? 0) + 1);
	return Math.max(...counts.values()) / (art.length * art[0].length);
}

/**
 * How far a picture may move toward its measured difficulty: the solver's score, above or
 * below the trend through play, shifts it about this many places per standard deviation.
 */
const SPREAD = 12;

/** The pictures in play order, nudged so harder ones come a little later. */
function byDifficulty(levels: Picture[]): Picture[] {
	const ys = levels.map((lv, k) => reportLevel(lv, START + k).score);
	const n = ys.length;
	const mx = (n - 1) / 2;
	const my = ys.reduce((a, b) => a + b, 0) / n;
	let sxy = 0;
	let sxx = 0;
	ys.forEach((y, x) => {
		sxy += (x - mx) * (y - my);
		sxx += (x - mx) ** 2;
	});
	const slope = sxy / sxx;
	const rest = ys.map((y, x) => y - (my + slope * (x - mx)));
	const sd = Math.sqrt(rest.reduce((a, r) => a + r * r, 0) / n) || 1;
	return levels
		.map((lv, k) => ({ lv, key: k + (SPREAD * rest[k]) / sd }))
		.sort((a, b) => a.key - b.key)
		.map((x) => x.lv);
}

/** Mean solver stats per 20 levels of play, as a table. */
function curve(levels: Picture[]) {
	const rows: Record<string, string | number>[] = [];
	for (let at = 0; at < levels.length; at += 20) {
		const rs = levels.slice(at, at + 20).map((lv, k) => reportLevel(lv, at + k));
		const mean = (f: (r: (typeof rs)[number]) => number) =>
			Math.round((10 * rs.reduce((a, r) => a + f(r), 0)) / rs.length) / 10;
		rows.push({
			levels: `${at + 1}-${at + rs.length}`,
			size: `${Math.round(mean((r) => r.w))}x${Math.round(mean((r) => r.h))}`,
			dots: Math.round(mean((r) => r.dots)),
			colors: mean((r) => r.colors),
			moves: Math.round(mean((r) => r.moves)),
			parks: mean((r) => r.parks),
			minTray: mean((r) => r.minTray),
			score: Math.round(mean((r) => r.score)),
			ms: mean((r) => r.ms)
		});
	}
	console.table(rows);
}

function make(tpl: Template, use: number, i: number, taken: Set<string>): Picture {
	const p = plan(i, tpl.aspect);
	let why = '';
	for (let attempt = 0; attempt < 12; attempt++) {
		const rng = makeRng(hashStr(`${tpl.id}:${use}:${attempt}`));
		const c = new Canvas(p.w, p.h, p.t, use, rng);
		const name = tpl.draw(c);
		const done = c.finish(p.colors, rng, MAX_SHARE);
		const id = slug(name);
		why = !done
			? 'no colors fit'
			: topShare(done.art) > MAX_SHARE
				? `one color is ${Math.round(100 * topShare(done.art))}%`
				: taken.has(id)
					? `"${id}" is taken`
					: '';
		if (why || !done) continue;
		taken.add(id);
		return { id, name, palette: done.palette, art: done.art };
	}
	throw new Error(`${tpl.id} (use ${use}, level ${i + 1}, ${p.w}x${p.h}): no picture, ${why}`);
}

if (args.only) {
	// A quick look: each named template at seven points in play, one row each.
	const pics: Picture[] = [];
	for (const id of args.only.split(',')) {
		const tpl = TEMPLATES.find((t) => t.id === id);
		if (!tpl) throw new Error(`no template "${id}"`);
		const row = [12, 40, 70, 100, 130, 160, 199].map((i, use) => make(tpl, use, i, new Set()));
		console.log(
			id,
			row
				.map((p) => `${p.art[0].length}x${p.art.length}/${Object.keys(p.palette).length}`)
				.join(' ')
		);
		pics.push(...row);
	}
	const file = args.sheet ?? '/tmp/mosaic-only.png';
	writeFileSync(file, sheet(pics, 7, 5));
	console.log(`wrote ${file}`);
} else {
	const taken = new Set(FIRST.levels.map((l) => l.id));
	const slots = order(TOTAL - START);
	const levels = byDifficulty(slots.map(({ tpl, use }, k) => make(tpl, use, START + k, taken)));
	const packs: { name: string; levels: Picture[] }[] = [];
	let at = 0;
	PACKS.forEach((name, p) => {
		const n = Math.round(((p + 1) * levels.length) / PACKS.length) - at;
		packs.push({ name, levels: levels.slice(at, at + n) });
		at += n;
	});
	if (!args.dry) {
		if (OUT === DIR) {
			// Old generated packs go first, so a renamed pack doesn't linger.
			for (const f of readdirSync(DIR)) {
				if (/^(0[2-9]|[1-9]\d)-.*\.json$/.test(f)) rmSync(new URL(f, DIR));
			}
		}
		for (const [p, pack] of packs.entries()) {
			const file = new URL(`${String(p + 2).padStart(2, '0')}-${slug(pack.name)}.json`, OUT);
			await writePack(file, pack);
		}
	}
	const counts = new Map<string, number>();
	slots.forEach((s) => counts.set(s.tpl.id, (counts.get(s.tpl.id) ?? 0) + 1));
	console.log(
		`${levels.length} pictures from ${counts.size} templates (most uses ${Math.max(...counts.values())})`
	);
	for (const [p, pack] of packs.entries()) {
		console.log(`${String(p + 2).padStart(2, '0')} ${pack.name}: ${pack.levels.length}`);
	}
	curve([...FIRST.levels, ...levels]);
	if (args.sheet) {
		writeFileSync(args.sheet, sheet([...FIRST.levels, ...levels], 10, 4));
		console.log(`wrote ${args.sheet}`);
	}
}
