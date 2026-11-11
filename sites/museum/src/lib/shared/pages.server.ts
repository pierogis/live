/*
 * The server side of a game's pages, the same for every game. Each game makes its
 * own with `gamePages` (src/lib/<game>/pages.server.ts), and its routes call it.
 */
import { error, type Cookies } from '@sveltejs/kit';

import type { GameInfo } from '../games';
import type { Pack, Picture } from './level';
import { packPicture } from './levels';
import type { GameSave } from './save';

interface GameParts<L extends Picture, S> {
	game: GameInfo;
	/** Every level, in play order, and the packs they come in. */
	levels: L[];
	packs: Pack<L>[];
	save: GameSave;
	/** Level `index`'s starting state, as the game's component builds it. */
	build(level: L, index: number): S;
}

export function gamePages<L extends Picture, S>({
	game,
	levels,
	packs,
	save,
	build
}: GameParts<L, S>) {
	const saveIn = (cookies: Cookies) => save.saveFromCookie(cookies.get(save.cookie));

	return {
		/** Every level's page, for prerendering. */
		entries: () => levels.map((lv) => ({ id: lv.id })),

		/**
		 * `/<game>/<level id>`, with the level's starting state built ahead so the page needn't
		 * build it. Ids, not places in play, so a link keeps its picture when packs are added.
		 */
		level(id: string) {
			const index = levels.findIndex((lv) => lv.id === id);
			const level = levels[index];
			if (!level) error(404, 'No such level');
			return {
				index,
				title: `${level.name} · ${game.name} · museum`,
				description: `${game.name} level ${index + 1}: ${level.name}`,
				initial: build(level, index)
			};
		},

		/**
		 * The mural you're working on, from your save, as one picture: or, once it's
		 * finished, the next one up (the first, before you've played).
		 */
		current(cookies: Cookies) {
			const saved = saveIn(cookies);
			let start = 0;
			const at = Math.max(
				0,
				packs.findIndex((p) => saved.level < (start += p.levels.length))
			);
			const open = packs.slice(at).find((p) => p.levels.some((l) => !saved.completed[l.id]));
			return packPicture(open ?? packs[at]);
		},

		/** `/<game>`: its murals, with your save so the ✓ marks and the way back are there at once. */
		home(cookies: Cookies) {
			return {
				save: saveIn(cookies),
				title: `${game.name} · museum`,
				description: game.about
			};
		}
	};
}
