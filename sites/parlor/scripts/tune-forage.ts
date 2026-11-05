// Pick each Forage level's deal so it's about as hard as its place in play order asks for:
//   pnpm -F parlor forage:tune [--seeds 24] [--rollouts 16] [--jobs 8] [--only <id>]
// Writes the chosen `seed`, and its measured careless win rate `wins` (which sets the
// level's difficulty index), into the level packs. Levels are shared out to `--jobs`
// worker processes.
import { spawn } from 'node:child_process';
import { availableParallelism } from 'node:os';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

import * as F from '../src/lib/forage/engine.ts';
import { difficultyIndex, LABELS } from '../src/lib/shared/difficulty.ts';
import { measure, targetWins } from '../src/lib/forage/report.ts';
import { loadPacks } from '../test/levels.ts';

const arg = (name: string, fallback: string) => {
	const at = process.argv.indexOf(`--${name}`);
	return at >= 0 ? process.argv[at + 1] : fallback;
};
const seeds = Number(arg('seeds', '24'));
const rollouts = Number(arg('rollouts', '16'));
const only = arg('only', '');
const worker = arg('worker', '');

interface Result {
	index: number;
	id: string;
	seed: number;
	careless: number;
	careful: number;
}

const packs = loadPacks<F.Level>('forage');
const levels = packs.flatMap((p) => p.levels);

/** The deal closest to the level's target; a bit harder beats a bit easier. */
function tune(index: number): Result {
	const lv = levels[index];
	const target = targetWins(index);
	let best = { seed: 0, careless: 1, careful: 1, miss: Infinity };
	for (let seed = 0; seed < seeds; seed++) {
		const d = measure(F.buildPuzzle(lv, index, {}, seed), rollouts);
		const miss = Math.abs(d.careless - target) + (d.careless > target ? 0.02 : 0);
		if (miss < best.miss) best = { seed, ...d, miss };
		if (miss < 0.03) break;
	}
	return { index, id: lv.id, seed: best.seed, careless: best.careless, careful: best.careful };
}

if (worker) {
	// A worker: tune every n-th level, print one JSON line per level.
	const [k, n] = worker.split('/').map(Number);
	for (let i = k; i < levels.length; i += n) {
		if (only && levels[i].id !== only) continue;
		console.log(JSON.stringify(tune(i)));
	}
} else {
	const jobs = Math.max(1, Number(arg('jobs', String(availableParallelism() - 1))));
	const script = fileURLToPath(import.meta.url);
	const pass = [
		'--seeds',
		String(seeds),
		'--rollouts',
		String(rollouts),
		...(only ? ['--only', only] : [])
	];
	const results: Result[] = [];
	const pct = (x: number) => `${Math.round(100 * x)}%`.padStart(4);
	await Promise.all(
		Array.from({ length: jobs }, (_, k) => {
			const child = spawn(process.execPath, [script, '--worker', `${k}/${jobs}`, ...pass], {
				stdio: ['ignore', 'pipe', 'inherit']
			});
			let buffer = '';
			child.stdout.on('data', (chunk) => {
				buffer += chunk;
				const lines = buffer.split('\n');
				buffer = lines.pop()!;
				for (const line of lines) {
					if (!line.trim()) continue;
					const r: Result = JSON.parse(line);
					results.push(r);
					const lv = levels[r.index];
					lv.seed = r.seed;
					lv.wins = Math.round(r.careless * 100) / 100;
					console.log(
						`${String(r.index + 1).padStart(3)} ${r.id.padEnd(22)} target ${pct(targetWins(r.index))}  careless ${pct(r.careless)}  careful ${pct(r.careful)}  seed ${String(r.seed).padStart(2)}  ${LABELS[difficultyIndex(lv.wins)! - 1]}`
					);
				}
			});
			return new Promise((done) => child.on('close', done));
		})
	);
	const prettier = await import('prettier');
	for (const pack of packs) {
		const file = pack.path.pathname;
		const options = (await prettier.resolveConfig(file)) ?? {};
		const { id: _id, path: _path, ...data } = pack;
		void _id;
		void _path;
		writeFileSync(
			file,
			await prettier.format(JSON.stringify(data), { ...options, filepath: file })
		);
	}
	console.log(`tuned ${results.length} levels`);
}
