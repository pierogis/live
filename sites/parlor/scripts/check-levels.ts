// Check every level of every game and print its stats: pnpm -F parlor levels [--order] [--measure]
// Fails when a level's picture has problems (like colors that look alike, from checkPicture,
// which every game's checks start with), when two levels of a game share an id, when a
// Mosaic level can't be solved with the standard tray, or when Forage can't build a deal.
//   --order    also list each game's levels from easiest to hardest, when it rates them
//   --measure  play each Forage level with every player (minutes) instead of trusting the
//              win share forage:tune saved
import { parseArgs } from 'node:util';

import { rules as forage } from '../src/lib/forage/rules.ts';
import { rules as mosaic } from '../src/lib/mosaic/rules.ts';
import type { Row, Rules } from '../src/lib/shared/editor/types.ts';
import type { Picture } from '../src/lib/shared/level.ts';
import { loadPacks } from '../test/levels.ts';

const { values: flags } = parseArgs({
	options: { order: { type: 'boolean' }, measure: { type: 'boolean' } }
});

type Line = Row & { pack: string; id: string };

let total = 0;
let bad = 0;

/** Print one game's table and problems, and add its levels to the totals. */
function checkGame<L extends Picture>(rules: Rules<L>) {
	const game = rules.id;
	const lines: Line[] = loadPacks<L>(game)
		.flatMap((pack) => pack.levels.map((lv) => ({ pack: pack.id, lv })))
		.map(({ pack, lv }, index) => ({ pack, id: lv.id, ...rules.row(lv, index, !!flags.measure) }));

	const seen = new Map<string, string>();
	for (const l of lines) {
		const first = seen.get(l.id);
		if (first) l.problems.push(`id "${l.id}" is also used in ${first}`);
		else seen.set(l.id, l.pack);
	}

	console.log(`\n${game}`);
	const table = lines.map((l) => ({ pack: l.pack, id: l.id, ...l.cols }));
	const cols = Object.keys(table[0] ?? {});
	const width = (k: string) =>
		Math.max(k.length, ...table.map((r) => String(r[k as keyof typeof r]).length));
	const print = (cells: string[]) =>
		console.log(
			cells
				.map((c, j) => c.padEnd(width(cols[j])))
				.join('  ')
				.trimEnd()
		);
	print(cols);
	for (const r of table) print(cols.map((k) => String(r[k as keyof typeof r])));

	for (const l of lines) {
		if (l.problems.length || l.warnings.length) {
			console.log(`\n${l.pack}/${l.id}:`);
			for (const p of l.problems) console.log(`  problem: ${p}`);
			for (const w of l.warnings) console.log(`  warning: ${w}`);
		}
	}

	const rated = lines.filter((l) => l.score !== undefined);
	if (flags.order && rated.length) {
		console.log(`\n${game}, easiest to hardest:`);
		for (const l of rated.sort((a, b) => a.score! - b.score!)) {
			console.log(`  ${l.score}\t${l.pack}/${l.id}`);
		}
	}
	total += lines.length;
	bad += lines.filter((l) => l.problems.length).length;
}

checkGame(mosaic);
checkGame(forage);

console.log(bad ? `\n${bad} level(s) need work` : `\nall ${total} levels ok`);
process.exitCode = bad ? 1 : 0;
