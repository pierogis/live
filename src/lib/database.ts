import type { Jurisdiction, Plate, Image, Scoresheet } from './models';

import { knex } from 'knex';
import { add_styles } from 'svelte/internal';

const db = knex({
	client: 'pg',
	connection: process.env.DATABASE_URL,
	searchPath: ['knex', 'public']
});

export function createPlate(request) {}

export async function listPlates(): Promise<Plate[]> {
	const partialPlates = await db
		.withSchema('emporium')
		.table<Omit<Plate, 'scoresheets' | 'images'>>('plates')
		.select();

	const plates: Plate[] = await Promise.all(
		partialPlates.map(async (partialPlate) => {
			let scoresheets = await db
				.withSchema('emporium')
				.table<Scoresheet>('scoresheets')
				.select()
				.where({
					plateId: partialPlate.id
				});

			let images = await db.withSchema('emporium').table<Image>('images').select().where({
				plateId: partialPlate.id
			});

			return { ...partialPlate, scoresheets, images };
		})
	);

	return plates;
}

export async function listJurisdictions(): Promise<Jurisdiction[]> {
	return await db.table('jurisdiction').select();
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
