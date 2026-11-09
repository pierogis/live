/*
 * Dev server only: lets the picture editor save levels straight into
 * src/lib/<game>/levels/*.json. Never part of a build or a deploy.
 *
 * POST /__levels/save  { game, pack, packName?, level, origin? }   (content-type: application/json)
 *   game      which game's packs, like "mosaic" or "forage"
 *   pack      pack file id like "01-first-light"; a new id creates the pack (named `packName`)
 *   level     { id, name, palette, art }
 *   origin    { pack, id } the level was loaded from or last saved as, when it was saved
 *             before. It may have been renamed, or moved to another pack: then it's
 *             taken out of its old pack.
 * Level ids are unique across all of a game's packs.
 *
 * Only the editor's own page may call it: a JSON content type makes the browser ask
 * first (a CORS preflight, which this server never allows) before another site's page
 * can post, and an Origin header from another host is turned away.
 */
import { existsSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';

import type { Picture } from '../src/lib/shared/level.ts';
import { TUNED } from '../src/lib/forage/engine.ts';
import { writePack } from './write-pack.ts';

const LIB = fileURLToPath(new URL('../src/lib/', import.meta.url));
/** Fields a level may carry beyond its picture, like a game's tuning. */
const EXTRAS = new Set<string>(TUNED);
const SLUG = /^[a-z0-9-]+$/;

interface PackData {
	name: string;
	levels: Picture[];
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

function check(level: Picture): string | null {
	if (!level || typeof level.id !== 'string' || !SLUG.test(level.id)) {
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

/** Why a request can't be from the editor's own page, or null when it can be. */
function foreign(req: IncomingMessage): string | null {
	const type = req.headers['content-type'] ?? '';
	if (!/^application\/json\s*(;|$)/i.test(type)) return 'content-type must be application/json';
	const origin = req.headers.origin;
	if (origin !== undefined) {
		let host = '';
		try {
			host = new URL(origin).host;
		} catch {
			/* "null" or garbage: not ours */
		}
		if (!host || host !== req.headers.host) return 'only the dev server itself may save';
	}
	return null;
}

export function levelsPlugin(): Plugin {
	return {
		name: 'parlor-levels',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/__levels/save', async (req, res) => {
				const reply = (status: number, body: object) => {
					res.statusCode = status;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify(body));
				};
				if (req.method !== 'POST') return reply(405, { error: 'POST only' });
				const refused = foreign(req);
				if (refused) return reply(403, { error: refused });
				try {
					const { game, pack, packName, level, origin } = JSON.parse(await readBody(req));
					const dir = `${LIB}${game}/levels/`;
					if (typeof game !== 'string' || !/^[a-z]+$/.test(game) || !existsSync(dir)) {
						return reply(400, { error: 'unknown game' });
					}
					if (typeof pack !== 'string' || !SLUG.test(pack)) {
						return reply(400, { error: 'pack must be lowercase letters, numbers and dashes' });
					}
					if (
						origin != null &&
						(typeof origin.pack !== 'string' ||
							!SLUG.test(origin.pack) ||
							typeof origin.id !== 'string')
					) {
						return reply(400, { error: 'origin must be { pack, id }' });
					}
					const bad = check(level);
					if (bad) return reply(400, { error: bad });
					const clean: Picture & Record<string, unknown> = {
						id: level.id,
						name: level.name.trim(),
						palette: level.palette,
						art: level.art
					};
					for (const k of EXTRAS) if (k in level) clean[k] = level[k];

					// Every pack of the game, plus the target pack when it's new.
					const packs = new Map<string, PackData>();
					for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
						packs.set(f.slice(0, -'.json'.length), JSON.parse(await readFile(dir + f, 'utf8')));
					}
					if (!packs.has(pack)) packs.set(pack, { name: String(packName || pack), levels: [] });

					// The level as it was saved before, if it still is.
					const from =
						origin && packs.get(origin.pack)?.levels.some((l) => l.id === origin.id)
							? { pack: origin.pack as string, id: origin.id as string }
							: null;
					for (const [id, p] of packs) {
						const clash = p.levels.some(
							(l) => l.id === clean.id && !(from && id === from.pack && l.id === from.id)
						);
						if (clash) return reply(409, { error: `${id} already has a level "${clean.id}"` });
					}

					const target = packs.get(pack)!;
					let index: number;
					if (from && from.pack === pack) {
						index = target.levels.findIndex((l) => l.id === from.id);
						target.levels[index] = clean;
					} else {
						index = target.levels.push(clean) - 1;
					}
					// Write the new place first, so a failed write can't lose the level.
					await writePack(`${dir}${pack}.json`, target);
					if (from && from.pack !== pack) {
						const old = packs.get(from.pack)!;
						old.levels = old.levels.filter((l) => l.id !== from.id);
						await writePack(`${dir}${from.pack}.json`, old);
					}
					reply(200, {
						ok: true,
						pack,
						index,
						movedFrom: from && from.pack !== pack ? from.pack : undefined
					});
				} catch (err) {
					reply(500, { error: String(err) });
				}
			});
		}
	};
}
