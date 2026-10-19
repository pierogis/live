import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	SESSION_NAME: { schema: (input) => input ?? '' },
	DEV_PASSPHRASE: { schema: (input) => input ?? '' },
	ENCRYPTION_SECRET: { schema: (input) => input ?? '' },
	MAILERSEND_API_KEY: { schema: (input) => input ?? '' },
	SESSION_LENGTH: { schema: (input) => input ?? '' }
});
