/*
 * The server side of a game's pages, the same for every game. Each game makes its
 * own with `gamePages` (src/lib/<game>/pages.server.ts), and its routes call it.
 */
import { error, redirect, type Cookies } from '@sveltejs/kit';

import type { GameInfo } from '../games';
import type { Picture } from './level';
import type { GameSave } from './save';

interface GameParts<L extends Picture, S> {
	game: GameInfo;
	/** Every level, in play order. */
	levels: L[];
	save: GameSave;
	/** Level `index`'s starting state, as the game's component builds it. */
	build(level: L, index: number): S;
}

export function gamePages<L extends Picture, S>({ game, levels, save, build }: GameParts<L, S>) {
	/** Level 1, built once: it's the same for everyone, and the page clones it. */
	let first: S | undefined;
	const saveIn = (cookies: Cookies) => save.saveFromCookie(cookies.get(save.cookie));

	return {
		/** `/<game>`: level 1, or straight on to the level your save is on. */
		start(cookies: Cookies) {
			const saved = saveIn(cookies);
			if (saved.level > 0) redirect(307, `/${game.id}/${saved.level + 1}`);
			first ??= build(levels[0], 0);
			return { title: `${game.name} · parlor`, description: game.about, initial: first };
		},

		/** Every level's page, for prerendering. */
		entries: () => levels.map((_, i) => ({ n: String(i + 1) })),

		/** `/<game>/N`, with the level's starting state built ahead so the page needn't build it. */
		level(n: string) {
			const index = Number(n) - 1;
			const level = levels[index];
			// Only the number as the site writes it, so /mosaic/05 isn't a second /mosaic/5.
			if (!level || n !== String(index + 1)) error(404, 'No such level');
			return {
				index,
				title: `${level.name} · ${game.name} · parlor`,
				description: `${game.name} level ${index + 1}: ${level.name}`,
				initial: build(level, index)
			};
		},

		/** `/<game>/pictures`, with your save so the ✓ marks are there at once. */
		pictures(cookies: Cookies) {
			return {
				save: saveIn(cookies),
				title: `${game.name} pictures · parlor`,
				description: `every ${game.name} picture`
			};
		},

		/** `/<game>/edit`. */
		editor() {
			return {
				title: `${game.name} editor · parlor`,
				description: `paint pictures for ${game.name}, check them, and play-test them`
			};
		}
	};
}
