import { z } from 'zod';

export const userIdInputName = 'user-id';

export const userSchema = z.object({
	serial: z.string().max(7).toUpperCase()
});
