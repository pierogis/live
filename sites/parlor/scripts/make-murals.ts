// Draws Mosaic's murals (scripts/murals/) into their pack files.
//   pnpm -F parlor murals [name…] [--look <dir>] [--dry]
// With no names it draws every mural. `--look` also saves two images of each one, whole
// and cut into panels. `--dry` writes no pack file. Either way it reports what each
// panel would be to play, and any dots that differ from the pack file as it stands.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import type { Level } from '../src/lib/mosaic/engine.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { MURALS } from './murals/index.ts';
import { pack, paint, PANEL } from './murals/mural.ts';
import { image } from './murals/png.ts';
import { writePack } from './write-pack.ts';

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: { look: { type: 'string' }, dry: { type: 'boolean' } }
});
const DIR = new URL('../src/lib/mosaic/levels/', import.meta.url);
const wanted = MURALS.filter(
	(m) => !positionals.length || positionals.some((p) => m.file.includes(p) || m.prefix === p)
);
if (!wanted.length) throw new Error(`no mural matches ${positionals.join(', ')}`);

let failed = false;
// A panel's place in play sets its blob sizes, so count from the first mural on.
let index = 0;
for (const m of MURALS) {
	const first = index;
	index += m.panels.length;
	if (!wanted.includes(m)) continue;
	const picture = paint(m);
	const data = pack(m, picture);
	const file = new URL(`${m.file}.json`, DIR);
	const old: Level[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).levels : [];

	console.log(`\n${m.name} (${m.file}), ${m.cols} by ${m.rows} panels`);
	data.levels.forEach((lv, k) => {
		const dots = lv.art.join('');
		const counts: Record<string, number> = {};
		for (const ch of dots) counts[ch] = (counts[ch] ?? 0) + 1;
		const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
		const share = Math.round((100 * n) / dots.length);
		const r = reportLevel(lv, first + k);
		const problems = [...r.problems];
		if (2 * n > dots.length) problems.push(`${top} covers ${share}% of it`);
		if (problems.length) failed = true;
		const was = old[k]?.art.join('');
		const moved =
			was === undefined || was.length !== dots.length
				? 'new'
				: [...dots].filter((ch, i) => ch !== was[i]).length || '';
		console.log(
			`  ${String(k + 1).padStart(2)} ${lv.name.padEnd(24)} score ${String(r.score).padStart(3)}  ` +
				`${top} ${share}%` +
				(moved ? `  ${moved === 'new' ? 'new' : `${moved} dots changed`}` : '') +
				(problems.length ? `  PROBLEM: ${problems.join('; ')}` : '')
		);
	});

	if (args.look) {
		mkdirSync(args.look, { recursive: true });
		const base = `${args.look.replace(/\/$/, '')}/${m.prefix}`;
		writeFileSync(`${base}.png`, image(picture, m.palette, 8));
		writeFileSync(`${base}-panels.png`, image(picture, m.palette, 6, m.panel ?? PANEL, 12));
	}
	if (!args.dry) await writePack(file, data);
}
if (failed) process.exitCode = 1;
