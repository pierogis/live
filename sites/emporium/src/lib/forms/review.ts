import * as v from 'valibot';

export const schema = v.object({
	id: v.optional(v.number()),
	userId: v.number(),
	description: v.string()
});
