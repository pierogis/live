// Draws every game's murals (scripts/murals/<game>/) into their pack files.
//   pnpm -F museum murals [name…] [--look <dir>] [--dry]
// No names draws them all. `--look` saves images of each, whole and in panels; `--dry`
// writes no pack file. Prints each panel's stats and how many dots changed. A Forage
// panel whose picture comes out the same keeps what forage:tune saved for it.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { TUNED } from '../src/lib/forage/engine.ts';
import { reportForage } from '../src/lib/forage/report.ts';
import type { GameId } from '../src/lib/games.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { checkPicture, pct } from '../src/lib/shared/checks.ts';
import type { Picture } from '../src/lib/shared/level.ts';
import { MURALS } from './murals/index.ts';
import { layout, pack, paint } from './murals/mural.ts';
import { image } from './murals/png.ts';
import { writePack } from './write-pack.ts';

/** What each game says about a panel at a place in play, and what a redraw keeps. */
const GAMES: Record<
	GameId,
	{
		report(lv: Picture, index: number): { note: string; problems: string[] };
		/** No color may cover more than half a panel. */
		half: boolean;
		/** Fields a panel keeps from its pack file while its picture stays the same. */
		keep: readonly string[];
	}
> = {
	mosaic: {
		report(lv, index) {
			const r = reportLevel(lv, index);
			return { note: `score ${String(r.score).padStart(3)}`, problems: r.problems };
		},
		half: true,
		keep: []
	},
	forage: {
		report(lv, index) {
			const r = reportForage(lv, index, 0);
			return { note: `${String(r.colonies).padStart(3)} colonies`, problems: r.problems };
		},
		half: false,
		keep: TUNED
	}
};

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: { look: { type: 'string' }, dry: { type: 'boolean' } }
});
const all = Object.values(MURALS).flat();
const wanted = all.filter(
	(m) => !positionals.length || positionals.some((p) => m.file.includes(p))
);
if (!wanted.length) throw new Error(`no mural matches ${positionals.join(', ')}`);

const same = (a: Picture, b: Picture) =>
	a.art.join('\n') === b.art.join('\n') && JSON.stringify(a.palette) === JSON.stringify(b.palette);

let failed = false;
for (const [id, game] of Object.entries(GAMES) as [GameId, (typeof GAMES)[GameId]][]) {
	const dir = new URL(`../src/lib/${id}/levels/`, import.meta.url);
	// A panel's place in play sets how hard it's made, so count from the game's first mural on.
	let index = 0;
	for (const m of MURALS[id]) {
		const first = index;
		index += m.panels.length;
		if (!wanted.includes(m)) continue;
		const picture = paint(m);
		const data = pack(m, picture);
		const file = new URL(`${m.file}.json`, dir);
		const old: Picture[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).levels : [];
		data.levels = data.levels.map((lv) => {
			const was = old.find((o) => o.id === lv.id && same(o, lv));
			if (!was) return lv;
			return {
				...lv,
				...Object.fromEntries(Object.entries(was).filter(([k]) => game.keep.includes(k)))
			};
		});
		const { pw, ph, rows } = layout(m);

		console.log(`\n${id}: ${m.name} (${m.file}), ${m.cols} by ${rows} panels of ${pw} by ${ph}`);
		data.levels.forEach((lv, k) => {
			const { counts, pixels } = checkPicture(lv);
			const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
			const share = pct(n / pixels);
			const r = game.report(lv, first + k);
			const problems = [...r.problems];
			if (game.half && 2 * n > pixels) problems.push(`${top} covers ${share} of it`);
			if (problems.length) failed = true;
			const dots = lv.art.join('');
			const was = old[k]?.art.join('');
			const changed =
				was?.length === dots.length ? [...dots].filter((ch, i) => ch !== was[i]).length : -1;
			const moved = changed < 0 ? '  new' : changed ? `  ${changed} dots changed` : '';
			console.log(
				`  ${String(k + 1).padStart(2)} ${lv.name.padEnd(24)} ${r.note}  ` +
					`${Object.keys(counts).length} colors, ${top} ${share}${moved}` +
					(problems.length ? `  PROBLEM: ${problems.join('; ')}` : '')
			);
		});

		if (args.look) {
			mkdirSync(args.look, { recursive: true });
			const base = `${args.look.replace(/\/$/, '')}/${m.prefix}`;
			writeFileSync(`${base}.png`, image(picture, m.palette, 8));
			writeFileSync(`${base}-panels.png`, image(picture, m.palette, 6, [pw, ph], 12));
		}
		if (!args.dry) await writePack(file, data);
	}
}
if (failed) process.exitCode = 1;
