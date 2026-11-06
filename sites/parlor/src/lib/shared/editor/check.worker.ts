/*
 * Runs a game's live check off the main thread, so painting stays smooth while a slow
 * check (Forage plays several games per check) works. Loads the game's pure rules
 * (src/lib/<game>/rules.ts) by id on first use.
 *
 * In:  { seq, game, level, index }
 * Out: { seq, report } or { seq, error }
 */
import type { Picture } from '../level.ts';
import type { Check, Rules } from './types.ts';

export interface CheckRequest {
	seq: number;
	game: string;
	level: Picture;
	index: number;
}

export type CheckReply = { seq: number; report: Check } | { seq: number; error: string };

const modules = import.meta.glob<{ rules: Rules }>('../../*/rules.ts');

self.onmessage = async (e: MessageEvent<CheckRequest>) => {
	const { seq, game, level, index } = e.data;
	let reply: CheckReply;
	try {
		const load = modules[`../../${game}/rules.ts`];
		if (!load) throw new Error(`no rules for ${game}`);
		const { rules } = await load();
		reply = { seq, report: rules.check(level, index) };
	} catch (err) {
		reply = { seq, error: String(err) };
	}
	self.postMessage(reply);
};
