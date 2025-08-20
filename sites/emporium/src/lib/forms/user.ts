import * as v from 'valibot';

export const userIdInputName = 'user-id';

export const userSchema = v.object({
	serial: v.pipe(v.string(), v.maxLength(7), v.toUpperCase())
});
