import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import { jurisdictions, type Jurisdiction, type schema } from '$db';

export const listJurisdictions = (db: PostgresJsDatabase<typeof schema>) =>
	db.select().from(jurisdictions);

export const getJurisdictions = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Jurisdiction>,
	take: number | undefined = undefined,
	skip = 0
) =>
	db.query.jurisdictions.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.abbreviation ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name ? eq(table.name, params.name) : undefined
			),
		limit: take,
		offset: skip
	});

export const getJurisdictionWithPlates = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Jurisdiction>
) =>
	db.query.jurisdictions.findFirst({
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

export const getJurisdiction = (
	db: PostgresJsDatabase<typeof schema>,
	params: Partial<Jurisdiction>
) =>
	db.query.jurisdictions.findFirst({
		where: (table, { or, eq }) =>
			or(
				params.id !== undefined ? eq(table.id, params.id) : undefined,
				params.abbreviation !== undefined ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name !== undefined ? eq(table.name, params.name) : undefined
			)
	});
