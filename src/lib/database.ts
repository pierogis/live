import type { Jurisdiction, Plate } from './models';

import { knex } from 'knex';

const db = knex({
	client: 'pg',
	connection: process.env.PG_CONNECTION_STRING,
	searchPath: ['knex', 'public']
});

export function createPlate(request) {}

export async function listPlates(): Promise<Plate[]> {
	let plates = await db.withSchema('emporium').table<Plate>('plate').select();

	return plates;
}

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	return await db.select().table('jurisdiction');
}

export async function get(params: { id?: number; jurisdiction?: string }): Promise<Plate> {
	let keys = Object.keys(params);
	return plates.find((plate) => {
		return keys.every((key) => {
			return plate[key] == params[key];
		});
	});
}

export async function getAll(params: { id?: number; jurisdiction?: string }): Promise<Plate[]> {
	let keys = Object.keys(params);
	return plates.filter((plate) => {
		return keys.every((key) => {
			return plate[key] == params[key];
		});
	});
}
