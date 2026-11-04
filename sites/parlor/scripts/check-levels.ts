// Check every Mosaic level and print its stats: pnpm -F parlor levels [--order]
// Fails when a level can't be solved with the standard tray or has colors that look alike.
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

const bad = rows.filter((r) => r.problems.length);
console.log(bad.length ? `\n${bad.length} level(s) need work` : `\nall ${rows.length} levels ok`);
process.exitCode = bad.length ? 1 : 0;
