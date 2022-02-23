import type { Plate } from './plates';

import { defineDb, star } from '@ff00ff/mammoth';
import { pool } from './pool';
import { state, plate } from './tables';

export const db = defineDb({ state, plate }, async (query, parameters) => {
	const result = await pool.query(query, parameters);

	return {
		affectedCount: result.rowCount,
		rows: result.rows
	};
});

const plates: Plate[] = [
	{
		id: 0,
		state: 'OH',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 4.5, identifiability: 5 }
	},
	{
		id: 5,
		state: 'OH',
		startYear: 2011,
		endYear: 2017,
		scores: { overall: 4.5, identifiability: 3 }
	},
	{
		id: 1,
		state: 'NY',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 3.2, identifiability: 5 }
	},
	{
		id: 2,
		state: 'NV',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 4, identifiability: 5 }
	},
	{
		id: 3,
		state: 'NH',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 2, identifiability: 5 }
	},
	{ id: 4, state: 'NJ', startYear: 2012, endYear: 2015, scores: { overall: 4, identifiability: 5 } }
];

export function createPlate(request) {}

export async function listPlates() {
	// const plates = await db.select(star()).from(db.plate);

	return plates;
}

export async function listStates() {
	return await db.select(star()).from(db.state);
}

export async function get(params: { id?: number; state?: string }) {
	let keys = Object.keys(params);
	return plates.find((plate) => {
		return keys.every((key) => {
			return plate[key] == params[key];
		});
	});
}

export async function getAll(params: { id?: number; state?: string }) {
	let keys = Object.keys(params);
	return plates.filter((plate) => {
		return keys.every((key) => {
			return plate[key] == params[key];
		});
	});
}
