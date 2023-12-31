import { z } from 'zod';

export const schema = z.object({
	id: z.number().optional(),
	userId: z.number(),
	description: z.string()
});
