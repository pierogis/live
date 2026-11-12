/* Forage's line per level in `pnpm -F museum levels`. Pure, with `.ts` imports, for node. */
import { pct } from '../shared/checks.ts';
import type { Rules } from '../shared/rules.ts';
import { cruxCounts, THOROUGH } from './cruxes.ts';
import { fromTries } from './difficulty.ts';
import type { Level } from './engine.ts';
import { GAMES, reportForage } from './report.ts';

export const rules: Rules<Level> = {
	id: 'forage',
	row(level, measure) {
		// Measuring every level takes minutes; by default trust what forage:tune saved.
		const r = reportForage(level, measure ? GAMES : 0, measure ? THOROUGH : undefined);
		const wins = measure ? r.difficulty.wins : (level.wins ?? NaN);
		const a = r.cruxes;
		const saved = { breaks: level.breaks, cruxes: level.cruxes, spread: level.spread };
		const c = a ? cruxCounts(a) : saved;
		const tries = r.tries ? [r.tries.best, r.tries.typical, r.tries.worst] : level.tries;
		const d = tries ? fromTries(tries[1]) : null;
		return {
			problems: r.problems,
			warnings: r.warnings,
			cols: {
				size: `${r.w}x${r.h}`,
				colonies: r.colonies,
				links: r.links,
				locks: r.locks,
				mystery: r.mystery,
				waits: r.pressure ? `${r.pressure.waits}/${r.pressure.sends}` : '—',
				held: r.pressure?.heldPairs ?? '—',
				cruxes: c.cruxes ?? '—',
				breaks: c.breaks ?? '—',
				spread: c.spread ?? '—',
				wins: Number.isNaN(wins) ? '—' : pct(wins),
				target: pct(r.target),
				tries: tries ? tries.map((t) => Math.round(t)).join('/') : '—',
				focus: level.focus === undefined ? '—' : pct(level.focus),
				pips: d ?? '—',
				...(measure
					? {
							strong: pct(r.difficulty.strong),
							clean: pct(r.difficulty.clean),
							look: pct(r.difficulty.look),
							careless: pct(r.difficulty.careless)
						}
					: {})
			}
		};
	}
};
