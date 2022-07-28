import {
	CACHE_URL,
	DATABASE_URL,
	DEV_PASSPHRASE,
	EMAIL_PASS,
	EMAIL_USER,
	ENCRYPTION_SECRET,
	SESSION_LENGTH
} from '$env/static/private';
import { PUBLIC_API_BASE } from '$env/static/public';

export const variables = {
	databaseUrl: DATABASE_URL,
	cacheUrl: CACHE_URL,
	sessionName: 'session',
	sessionLength: parseInt(SESSION_LENGTH),
	encryptionSecret: ENCRYPTION_SECRET,
	emailUser: EMAIL_USER,
	emailPass: EMAIL_PASS,
	devPassphrase: DEV_PASSPHRASE,
	apiBase: PUBLIC_API_BASE
};
