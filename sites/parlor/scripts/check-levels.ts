// Check every level of every game and print its stats: pnpm -F parlor levels [--order] [--measure]
// Fails when a Mosaic level can't be solved with the standard tray or has colors that look
// alike, or when a Forage level's built-in winning play doesn't win.
import type { Level as ForageLevel } from '../src/lib/forage/engine.ts';
import { reportForage } from '../src/lib/forage/report.ts';
import { reportLevel, type LevelReport } from '../src/lib/mosaic/report.ts';
import { loadPacks } from '../test/levels.ts';

type Row = LevelReport & { pack: string; id: string; size: string; clean: string };

const rows: Row[] = [];
let index = 0;
for (const pack of loadPacks()) {
	for (const lv of pack.levels) {
		const r = reportLevel(lv, index++);
		rows.push({
			...r,
			pack: pack.id,
			id: lv.id,
			size: `${r.w}x${r.h}`,
			clean: `${r.cleanGroups}/${r.groups}`,
			ms: Math.round(r.ms)
		});
	}
}

const cols: (keyof Row)[] = [
	'pack',
	'id',
	'size',
	'dots',
	'colors',
	'moves',
	'parks',
	'minTray',
	'shuffle',
	'biggestGroup',
	'clean',
	'score',
	'ms'
];
const width = (k: keyof Row) => Math.max(k.length, ...rows.map((r) => String(r[k]).length));
console.log(cols.map((k) => k.padEnd(width(k))).join('  '));
for (const r of rows) console.log(cols.map((k) => String(r[k]).padEnd(width(k))).join('  '));

for (const r of rows) {
	if (r.problems.length || r.warnings.length) {
		console.log(`\n${r.pack}/${r.id}:`);
		for (const p of r.problems) console.log(`  problem: ${p}`);
		for (const w of r.warnings) console.log(`  warning: ${w}`);
	}
}

if (process.argv.includes('--order')) {
	console.log('\neasiest to hardest:');
	for (const r of [...rows].sort((a, b) => a.score - b.score)) {
		console.log(`  ${r.score}\t${r.pack}/${r.id}`);
	}
}

// Forage: the built-in play wins, and how often random players win against the target.
console.log('\nforage');
const pct = (x: number) => `${Math.round(100 * x)}%`;
const forage: { problems: string[] }[] = [];
let forageIndex = 0;
for (const pack of loadPacks<ForageLevel>('forage')) {
	for (const lv of pack.levels) {
		// Measuring every level takes minutes; by default trust what forage:tune saved.
		const r = reportForage(lv, forageIndex++, process.argv.includes('--measure') ? 20 : 0);
		if (!process.argv.includes('--measure') && lv.wins !== undefined) {
			r.difficulty = { careless: lv.wins, careful: NaN };
		}
		forage.push(r);
		console.log(
			`  ${pack.id.padEnd(13)} ${lv.id.padEnd(22)} ${r.w}x${r.h}  colonies ${r.colonies}  links ${r.links}  locks ${r.locks}  mystery ${r.mystery}  careless wins ${pct(r.difficulty.careless)} (target ${pct(r.target)})`
		);
		for (const p of r.problems) console.log(`    problem: ${p}`);
	}
}

const bad = [...rows, ...forage].filter((r) => r.problems.length);
const total = rows.length + forage.length;
console.log(bad.length ? `\n${bad.length} level(s) need work` : `\nall ${total} levels ok`);
process.exitCode = bad.length ? 1 : 0;
