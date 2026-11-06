/*
 * Forage's checks for the picture editor and `pnpm -F parlor levels`. Pure, with `.ts`
 * imports, so the editor's check worker and node scripts can load it.
 */
import { LABELS } from '../shared/difficulty.ts';
import { pct } from '../shared/editor/checks.ts';
import type { Rules } from '../shared/editor/types.ts';
import { cruxCounts, QUICK, THOROUGH, type Analysis } from './cruxes.ts';
import { difficultyIndex } from './difficulty.ts';
import type { Level } from './engine.ts';
import { forgetSends } from './player.ts';
import { GAMES, reportForage, type Pressure } from './report.ts';

/**
 * Games by each player per check: few, so checking keeps up with painting (a
 * second or two on a big picture). `forage:tune` measures properly.
 */
const CHECK_GAMES = 2;

/** Waits in the built-in play, like "12 of 50 sends, 9 long". */
function waits(p: Pressure | null): string {
	return p ? `${p.waits} of ${p.sends} sends, ${p.longWaits} long` : '—';
}

/** Cruxes, like "3 (2 rule breaks), by third 1 · 0 · 2". */
function cruxes(a: Analysis | null): string {
	if (!a) return '—';
	const partial = a.complete ? '' : ' in the part checked (the quick check stops after a second)';
	return `${a.real} (${a.breaks} rule ${a.breaks === 1 ? 'break' : 'breaks'}), by third ${a.byThird.join(' · ')}${partial}`;
}

export const rules: Rules<Level> = {
	id: 'forage',
	// A changed picture deals differently, so what was measured and searched no longer holds.
	forget: ['wins', 'deal', 'breaks', 'cruxes', 'spread'],
	check(level, index) {
		forgetSends();
		const r = reportForage(level, index, CHECK_GAMES, QUICK);
		if (r.problems.length) {
			return { problems: r.problems, warnings: r.warnings, summary: '', stats: [] };
		}
		const a = r.cruxes;
		const d = difficultyIndex(r.difficulty.wins, a ? cruxCounts(a) : undefined);
		const { strong, clean, look, careless } = r.difficulty;
		return {
			problems: [],
			warnings: [
				...r.warnings,
				...(level.wins !== undefined ? [] : ['not tuned yet: run pnpm -F parlor forage:tune'])
			],
			summary: 'Winnable: the built-in play clears it.',
			stats: [
				{ label: 'food', value: `${r.blocks} in ${r.colors} colors` },
				{ label: 'colonies', value: String(r.colonies) },
				{ label: 'linked groups', value: String(r.links) },
				{ label: 'locks', value: String(r.locks) },
				{ label: 'mystery', value: String(r.mystery) },
				{ label: 'waits', value: waits(r.pressure) },
				{ label: 'groups held long', value: String(r.pressure?.heldPairs ?? '—') },
				{ label: 'cruxes', value: cruxes(a) },
				{
					label: 'wins',
					value: `about ${pct(r.difficulty.wins)} (strong ${pct(strong)}, rule of thumb ${pct(clean)}, with look ahead ${pct(look)}, careless ${pct(careless)}; ${CHECK_GAMES} games each)`
				},
				{ label: 'difficulty', value: d ? LABELS[d - 1].toLowerCase() : '—' }
			]
		};
	},
	row(level, index, measure) {
		// Measuring every level takes minutes; by default trust what forage:tune saved.
		const r = reportForage(level, index, measure ? GAMES : 0, measure ? THOROUGH : undefined);
		const wins = measure ? r.difficulty.wins : (level.wins ?? NaN);
		const a = r.cruxes;
		const saved = { breaks: level.breaks, cruxes: level.cruxes, spread: level.spread };
		const c = a ? cruxCounts(a) : saved;
		const d = Number.isNaN(wins) ? null : difficultyIndex(wins, c);
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
