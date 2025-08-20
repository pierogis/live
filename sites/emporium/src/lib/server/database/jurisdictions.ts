import { drizzle } from 'drizzle-orm/d1';

import { jurisdictions, type Jurisdiction } from '$db/schema';
import type { DrizzleClient } from '.';

export const listJurisdictions = async (db: DrizzleClient) => {
	return await db.select().from(jurisdictions);
};

export const getJurisdictions = async (
	db: DrizzleClient,
	params: Partial<Jurisdiction>,
	take: number | undefined = undefined,
	skip = 0
) => {
	return await db.query.jurisdictions.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.abbreviation ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name ? eq(table.name, params.name) : undefined
			),
		limit: take,
		offset: skip
	});
};

export const getJurisdictionWithPlates = async (
	db: DrizzleClient,
	params: Partial<Jurisdiction>
) => {
	return await db.query.jurisdictions.findFirst({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.abbreviation ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name ? eq(table.name, params.name) : undefined
			),
		with: {
			plates: {
				with: {
					jurisdiction: true,
					model: {
						columns: {},
						with: {
							scores: true,
							reviews: {
								with: {
									user: true
								}
							},
							images: true
						}
					}
				}
			}
		}
	});
};

export const getJurisdiction = async (db: DrizzleClient, params: Partial<Jurisdiction>) => {
	return await db.query.jurisdictions.findFirst({
		where: (table, { or, eq }) =>
			or(
				params.id !== undefined ? eq(table.id, params.id) : undefined,
				params.abbreviation !== undefined ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name !== undefined ? eq(table.name, params.name) : undefined
			)
	});
};
