import {
	sqliteTable,
	integer,
	text,
	uniqueIndex,
	primaryKey,
	check
} from 'drizzle-orm/sqlite-core';

import { type InferSelectModel, sql, relations, type InferInsertModel } from 'drizzle-orm';

export type Ware = 'plate';
const ware = text('ware').$type<Ware>().notNull();

export const models = sqliteTable('models', {
	id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
	ware: ware
});

export type Model = InferSelectModel<typeof models>;

export const categories = sqliteTable(
	'categories',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		name: text('name', { length: 256 }).notNull(),
		ware: ware,
		symbol: text('symbol', { length: 4 })
	},
	(table) => [uniqueIndex('categories_name_ware_unique').on(table.name, table.ware)]
);

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export const reviews = sqliteTable(
	'reviews',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
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
		description: text('description', { length: 2048 }).notNull()
	},
	(table) => [uniqueIndex('reviews_user_id_model_id_unique').on(table.modelId, table.userId)]
);

export type Review = InferSelectModel<typeof reviews>;
export type NewReview = InferInsertModel<typeof reviews>;

export const scores = sqliteTable(
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
	(table) => [
		primaryKey({ columns: [table.modelId, table.userId, table.categoryId] }),
		check('value_within_0_10', sql`${table.value} >= 0 AND ${table.value} <= 10`)
	]
);

export type Score = InferSelectModel<typeof scores>;
export type NewScore = InferInsertModel<typeof scores>;

export const images = sqliteTable(
	'images',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		modelId: integer('model_id')
			.notNull()
			.references(() => models.id, {
				onDelete: 'cascade',
				onUpdate: 'no action'
			}),
		url: text('url', { length: 256 }).notNull()
	},
	(images) => [uniqueIndex('images_url_unique').on(images.url)]
);

export type Image = InferSelectModel<typeof images>;
export type NewImage = InferInsertModel<typeof images>;

export const jurisdictions = sqliteTable(
	'jurisdictions',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		abbreviation: text('abbreviation', { length: 2 }).notNull(),
		name: text('name', { length: 256 }).notNull()
	},
	(table) => [uniqueIndex('jurisdictions_abbreviation_unique').on(table.abbreviation)]
);

export type Jurisdiction = InferSelectModel<typeof jurisdictions>;
export type NewJurisdiction = InferInsertModel<typeof jurisdictions>;

export const plates = sqliteTable('plates', {
	modelId: integer('model_id', { mode: 'number' })
		.primaryKey({ autoIncrement: true })
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

export type Plate = InferSelectModel<typeof plates>;
export type NewPlate = InferInsertModel<typeof plates>;

export const users = sqliteTable(
	'users',
	{
		id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
		email: text('email', { length: 256 }).notNull(),
		serial: text('serial', { length: 256 }).notNull(),
		isAdmin: integer('is_admin', { mode: 'boolean' }).notNull().default(false)
	},
	(table) => [
		uniqueIndex('users_email_unique').on(table.email),
		uniqueIndex('users_serial_unique').on(table.serial)
	]
);

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

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

export const jurisdictionsRelations = relations(jurisdictions, ({ many }) => ({
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
