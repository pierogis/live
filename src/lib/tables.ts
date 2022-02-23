import { defineTable, text, integer } from '@ff00ff/mammoth';

export const state = defineTable({
	abbreviation: text().primaryKey(),
	name: text().notNull()
});

export const plate = defineTable({
	id: integer().primaryKey(),
	state: text().references(state, 'abbreviation'),
	startYear: integer().notNull(),
	endYear: integer().notNull()
	// scores: { overall: 4.5, identifiability: 5 }
});

// export const score = defineTable({
// 	id: integer().primaryKey(),
// 	plateId: text().references(plate, 'id'),
// 	startYear: integer().notNull(),
// 	endYear: integer().notNull(),
// 	scores: { overall: 4.5, identifiability: 5 }
// });
