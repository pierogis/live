import { error, type Cookies } from '@sveltejs/kit';

import type { GameInfo } from '../games';
import type { Pack, Picture } from './level';
import { packPicture } from './levels';
import type { GameSave } from './save';

interface GameParts<L extends Picture, S> {
	game: GameInfo;
	levels: L[];
	packs: Pack<L>[];
	save: GameSave;
	build(level: L): S;
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
		entries: () => levels.map((lv) => ({ id: lv.id })),

		level(id: string) {
			const index = levels.findIndex((lv) => lv.id === id);
			const level = levels[index];
			if (!level) error(404, 'No such level');
			return {
				index,
				title: `${level.name} · ${game.name} · museum`,
				description: `${game.name} level ${index + 1}: ${level.name}`,
				initial: build(level)
			};
		},

		current(cookies: Cookies) {
			const saved = saveIn(cookies);
			let start = 0;
			const at = Math.max(
				0,
				packs.findIndex((p) => saved.level < (start += p.levels.length))
			);
			const open = packs.slice(at).find((p) => p.levels.some((l) => !saved.completed[l.id]));
			const pack = open ?? packs[at];
			const panels = pack.mural ? pack.levels : pack.levels.slice(0, 1);
			return {
				...packPicture(pack),
				name: pack.name,
				cols: pack.mural?.cols ?? 1,
				panel: { w: panels[0].art[0].length, h: panels[0].art.length },
				done: panels.map((l) => !!saved.completed[l.id])
			};
		},

		home(cookies: Cookies) {
			return {
				save: saveIn(cookies),
				title: `${game.name} · museum`,
				description: game.about
			};
		}
	};
}
