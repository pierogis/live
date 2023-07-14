import {
	pgTable,
	serial,
	varchar,
	boolean,
	integer,
	uniqueIndex,
	primaryKey,
	check,
	pgEnum
} from 'drizzle-orm/pg-core';

import { type InferModel, sql, relations } from 'drizzle-orm';

export const wareEnum = pgEnum('ware', ['plate']);

export const models = pgTable('models', {
	id: serial('id').primaryKey(),
	ware: wareEnum('ware').notNull()
});

export type Model = InferModel<typeof models>;

export const categories = pgTable(
	'categories',
	{
		id: serial('id').primaryKey(),
		name: varchar('name', { length: 256 }).notNull(),
		ware: wareEnum('ware').notNull(),
		symbol: varchar('symbol', { length: 4 })
	},
	(table) => {
		return {
			nameWareUnique: uniqueIndex('categories_name_ware_unique').on(table.name, table.ware)
		};
	}
);

export type Category = InferModel<typeof categories>;
export type NewCategory = InferModel<typeof categories, 'insert'>;

export const reviews = pgTable(
	'reviews',
	{
		id: serial('id').primaryKey(),
		modelId: integer('model_id')
			.notNull()
			.references(() => models.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		description: varchar('description', { length: 2048 }).notNull()
	},
	(table) => {
		return {
			userIdModelIdUnique: uniqueIndex('reviews_user_id_model_id_unique').on(
				table.modelId,
				table.userId
			)
		};
	}
);

export type Review = InferModel<typeof reviews>;
export type NewReview = InferModel<typeof reviews, 'insert'>;

export const scores = pgTable(
	'scores',
	{
		modelId: integer('model_id')
			.notNull()
			.references(() => models.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		categoryId: integer('category_id')
			.notNull()
			.references(() => categories.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		value: integer('value').notNull()
	},
	(table) => {
		return {
			scoresPkey: primaryKey(table.modelId, table.userId, table.categoryId),
			valueCheck: check('value_within_0_10', sql`${table.value} >= 0 AND ${table.value} <= 10`)
		};
	}
);

export type Score = InferModel<typeof scores>;
export type NewScore = InferModel<typeof scores, 'insert'>;

export const images = pgTable(
	'images',
	{
		id: serial('id').primaryKey(),
		modelId: integer('model_id')
			.notNull()
			.references(() => models.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		url: varchar('url', { length: 256 }).notNull()
	},
	(images) => {
		return {
			urlUnique: uniqueIndex('images_url_unique').on(images.url)
		};
	}
);

export type Image = InferModel<typeof images>;
export type NewImage = InferModel<typeof images, 'insert'>;

export const jurisdictions = pgTable(
	'jurisdictions',
	{
		id: serial('id').primaryKey(),
		abbreviation: varchar('abbreviation', { length: 2 }).notNull(),
		name: varchar('name', { length: 256 }).notNull()
	},
	(table) => {
		return {
			abrreviationUnique: uniqueIndex('jurisdictions_abbreviation_unique').on(table.abbreviation)
		};
	}
);

export type Jurisdiction = InferModel<typeof jurisdictions>;
export type NewJurisdiction = InferModel<typeof jurisdictions, 'insert'>;

export const plates = pgTable('plates', {
	modelId: integer('model_id')
		.primaryKey()
		.references(() => models.id, {
			onDelete: 'cascade',
			onUpdate: 'no action'
		}),
	jurisdictionId: integer('jurisdiction_id')
		.notNull()
		.references(() => jurisdictions.id, {
			onDelete: 'cascade',
			onUpdate: 'no action'
		}),
	startYear: integer('start_year'),
	endYear: integer('end_year')
});

export type Plate = InferModel<typeof plates>;
export type NewPlate = InferModel<typeof plates, 'insert'>;

export const users = pgTable(
	'users',
	{
		id: serial('id').primaryKey(),
		email: varchar('email', { length: 256 }).notNull(),
		serial: varchar('serial', { length: 256 }).notNull(),
		isAdmin: boolean('is_admin').notNull().default(false)
	},
	(table) => {
		return {
			emailUnique: uniqueIndex('users_email_unique').on(table.email),
			serialUnique: uniqueIndex('users_serial_unique').on(table.serial)
		};
	}
);

export type User = InferModel<typeof users>;
export type NewUser = InferModel<typeof users, 'insert'>;

export type FullPlate = Plate & {
	jurisdiction: Jurisdiction;
	model: {
		scores: Score[];
		images: Image[];
		reviews: (Review & { user: User })[];
	};
};

export const platesRelations = relations(plates, ({ one }) => ({
	jurisdiction: one(jurisdictions, {
		fields: [plates.jurisdictionId],
		references: [jurisdictions.id]
	}),
	model: one(models, {
		fields: [plates.modelId],
		references: [models.id]
	})
}));

export const jurisdictionsRelations = relations(jurisdictions, ({ many, one }) => ({
	plates: many(plates)
}));

export const modelsRelations = relations(models, ({ many }) => ({
	images: many(images),
	scores: many(scores),
	reviews: many(reviews)
}));

export const scoresRelations = relations(scores, ({ one }) => ({
	model: one(models, {
		fields: [scores.modelId],
		references: [models.id]
	}),
	user: one(users, {
		fields: [scores.userId],
		references: [users.id]
	})
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
	model: one(models, {
		fields: [reviews.modelId],
		references: [models.id]
	}),
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	})
}));

export const imagesRelations = relations(images, ({ one }) => ({
	model: one(models, {
		fields: [images.modelId],
		references: [models.id]
	})
}));

export const usersRelations = relations(users, ({ many }) => ({
	reviews: many(reviews),
	scores: many(scores)
}));
