// Draws Mosaic's murals (scripts/murals/) into their pack files.
//   pnpm -F parlor murals [name…] [--look <dir>] [--dry]
// No names draws them all. `--look` saves images of each, whole and in panels; `--dry`
// writes no pack file. Prints each panel's score and how many dots changed.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import type { Level } from '../src/lib/mosaic/engine.ts';
import { reportLevel } from '../src/lib/mosaic/report.ts';
import { checkPicture, pct } from '../src/lib/shared/editor/checks.ts';
import { MURALS } from './murals/index.ts';
import { layout, pack, paint } from './murals/mural.ts';
import { image } from './murals/png.ts';
import { writePack } from './write-pack.ts';

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: { look: { type: 'string' }, dry: { type: 'boolean' } }
});
const DIR = new URL('../src/lib/mosaic/levels/', import.meta.url);
const wanted = MURALS.filter(
	(m) => !positionals.length || positionals.some((p) => m.file.includes(p))
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
	const { pw, ph, rows } = layout(m);

	console.log(`\n${m.name} (${m.file}), ${m.cols} by ${rows} panels`);
	data.levels.forEach((lv, k) => {
		const { counts, pixels } = checkPicture(lv);
		const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
		const share = pct(n / pixels);
		const r = reportLevel(lv, first + k);
		const problems = [...r.problems];
		if (2 * n > pixels) problems.push(`${top} covers ${share} of it`);
		if (problems.length) failed = true;
		const dots = lv.art.join('');
		const was = old[k]?.art.join('');
		const changed =
			was?.length === dots.length ? [...dots].filter((ch, i) => ch !== was[i]).length : -1;
		const moved = changed < 0 ? '  new' : changed ? `  ${changed} dots changed` : '';
		console.log(
			`  ${String(k + 1).padStart(2)} ${lv.name.padEnd(24)} score ${String(r.score).padStart(3)}  ` +
				`${top} ${share}${moved}` +
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
if (failed) process.exitCode = 1;
