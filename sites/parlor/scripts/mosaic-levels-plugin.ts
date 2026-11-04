/*
 * Dev server only: lets the Mosaic editor save levels straight into
 * src/lib/mosaic/levels/*.json. Never part of a build or a deploy.
 *
 * POST /__mosaic/save  { pack, level, replaces? }
 *   pack      pack file id like "01-first-light"; a new id creates the pack (needs `packName`)
 *   level     { id, name, palette, art }
 *   replaces  id of the level being edited, when it was saved before (it may have been renamed)
 */
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

const DIR = fileURLToPath(new URL('../src/lib/mosaic/levels/', import.meta.url));

interface LevelIn {
	id: string;
	name: string;
	palette: Record<string, string>;
	art: string[];
}

function readBody(req: IncomingMessage): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = '';
		req.on('data', (chunk) => {
			body += chunk;
			if (body.length > 1e6) reject(new Error('too big'));
		});
		req.on('end', () => resolve(body));
		req.on('error', reject);
	});
}

function check(level: LevelIn): string | null {
	if (!level || typeof level.id !== 'string' || !/^[a-z0-9-]+$/.test(level.id)) {
		return 'id must be lowercase letters, numbers and dashes';
	}
	if (typeof level.name !== 'string' || !level.name.trim()) return 'needs a name';
	if (!Array.isArray(level.art) || !level.art.length) return 'needs art rows';
	const w = level.art[0].length;
	if (level.art.some((r) => typeof r !== 'string' || r.length !== w)) return 'rows differ in width';
	for (const [k, hex] of Object.entries(level.palette ?? {})) {
		if (k.length !== 1 || k === '.' || !/^#[0-9a-f]{6}$/i.test(hex)) return `bad color ${k}`;
	}
	return null;
}

export function mosaicLevels(): Plugin {
	return {
		name: 'mosaic-levels',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__mosaic/save', async (req, res) => {
				const reply = (status: number, body: object) => {
					res.statusCode = status;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify(body));
				};
				if (req.method !== 'POST') return reply(405, { error: 'POST only' });
				try {
					const { pack, packName, level, replaces } = JSON.parse(await readBody(req));
					if (typeof pack !== 'string' || !/^[a-z0-9-]+$/.test(pack)) {
						return reply(400, { error: 'pack must be lowercase letters, numbers and dashes' });
					}
					const bad = check(level);
					if (bad) return reply(400, { error: bad });
					const clean: LevelIn = {
						id: level.id,
						name: level.name.trim(),
						palette: level.palette,
						art: level.art
					};

					const file = `${DIR}${pack}.json`;
					const data = existsSync(file)
						? JSON.parse(await readFile(file, 'utf8'))
						: { name: String(packName || pack), levels: [] };
					const levels: LevelIn[] = data.levels;
					const at = levels.findIndex((l) => l.id === (replaces || clean.id));
					const clash = levels.findIndex((l) => l.id === clean.id);
					if (clash >= 0 && clash !== at) {
						return reply(409, { error: `${pack} already has a level "${clean.id}"` });
					}
					if (at >= 0) levels[at] = clean;
					else levels.push(clean);

					const prettier = await import('prettier');
					const options = (await prettier.resolveConfig(file)) ?? {};
					const text = await prettier.format(JSON.stringify(data), { ...options, filepath: file });
					await writeFile(file, text);
					reply(200, { ok: true, pack, index: at >= 0 ? at : levels.length - 1 });
				} catch (err) {
					reply(500, { error: String(err) });
				}
			});
		}
	};
}
