import { jurisdictions, type Jurisdiction } from '$db/schema';

import { db } from '.';

export const listJurisdictions = async () => await db.select().from(jurisdictions);

export const getJurisdictions = async (
	params: Partial<Jurisdiction>,
	take: number = undefined,
	skip = 0
) =>
	await db.query.jurisdictions.findMany({
		where: (table, { and, eq }) =>
			and(
				params.id ? eq(table.id, params.id) : undefined,
				params.abbreviation ? eq(table.abbreviation, params.abbreviation) : undefined,
				params.name ? eq(table.name, params.name) : undefined
			),
		limit: take,
		offset: skip
	});

export const getJurisdictionWithPlates = async (params: Partial<Jurisdiction>) =>
	await db.query.jurisdictions.findFirst({
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

export const getJurisdiction = async (params: Partial<Jurisdiction>) =>
	await db.query.jurisdictions.findFirst({
		where: (table, { or, eq }) =>
			or(
				eq(table.id, params.id),
				eq(table.abbreviation, params.abbreviation),
				eq(table.name, params.name)
			)
	});
