/*
 * The editor's live check, off the main thread, so painting stays smooth while a slow
 * check (Forage plays several games per check) works. Each game runs it in its own
 * worker, src/lib/<game>/check.worker.ts, which imports that game's rules.
 *
 * In:  { seq, level, index }
 * Out: { seq, report } or { seq, error }
 */
import type { Picture } from '../level.ts';
import type { Check, Rules } from './types.ts';

export interface CheckRequest<L extends Picture = Picture> {
	seq: number;
	level: L;
	index: number;
}

export type CheckReply = { seq: number; report: Check } | { seq: number; error: string };

/** In a worker: answer the editor's check requests with `rules`. */
export function serveChecks<L extends Picture>(rules: Rules<L>) {
	self.onmessage = (e: MessageEvent<CheckRequest<L>>) => {
		const { seq, level, index } = e.data;
		let reply: CheckReply;
		try {
			reply = { seq, report: rules.check(level, index) };
		} catch (err) {
			reply = { seq, error: String(err) };
		}
		self.postMessage(reply);
	};
}
