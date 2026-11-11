// Preview one Forage mural while drawing it, without writing its pack file:
//   node scripts/murals/forage/look.ts <file in this folder> <first level index> <out dir>
// e.g. `node scripts/murals/forage/look.ts thief.ts 12 /tmp/look`. Saves <prefix>.png
// (whole) and <prefix>-panels.png (cut apart), and prints each panel's colonies, colors,
// biggest color and any problem (like two colors too close to tell apart).
import { mkdirSync, writeFileSync } from 'node:fs';

import { reportForage } from '../../../src/lib/forage/report.ts';
import { checkPicture, pct } from '../../../src/lib/shared/checks.ts';
import { layout, pack, paint, type Mural } from '../mural.ts';
import { image } from '../png.ts';

const [file, first, out] = process.argv.slice(2);
if (!file || !first || !out) throw new Error('usage: look.ts <file.ts> <first index> <out dir>');
const mod: Record<string, unknown> = await import(new URL(file, import.meta.url).href);
const m = Object.values(mod).find((v): v is Mural => !!v && typeof v === 'object' && 'draw' in v);
if (!m) throw new Error(`${file} exports no mural`);

const picture = paint(m);
const { pw, ph, rows } = layout(m);
console.log(`${m.name}: ${m.cols} by ${rows} panels of ${pw} by ${ph}`);
pack(m, picture).levels.forEach((lv, k) => {
	const { counts, pixels } = checkPicture(lv);
	const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
	const r = reportForage(lv, Number(first) + k, 0);
	console.log(
		`  ${String(k + 1).padStart(2)} ${lv.name.padEnd(24)} ${String(r.colonies).padStart(3)} colonies  ` +
			`${Object.keys(counts).length} colors, ${top} ${pct(n / pixels)}` +
			(r.problems.length ? `  PROBLEM: ${r.problems.join('; ')}` : '')
	);
});
mkdirSync(out, { recursive: true });
writeFileSync(`${out}/${m.prefix}.png`, image(picture, m.palette, 8));
writeFileSync(`${out}/${m.prefix}-panels.png`, image(picture, m.palette, 6, [pw, ph], 12));
