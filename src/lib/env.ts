import dotenv from 'dotenv';

export let variables: {
	databaseUrl: string;
	cacheUrl: string;
	sessionName: string;
	sessionLength: number;
	encryptionSecret: string;
	emailUser: string;
	emailPass: string;
	devPassphrase: string;
};
export function setupEnv(): void {
	dotenv.config();

	variables = {
		databaseUrl: process.env.DATABASE_URL,
		cacheUrl: process.env.CACHE_URL,
		sessionName: 'session',
		sessionLength: parseInt(process.env.SESSION_LENGTH),
		encryptionSecret: process.env.ENCRYPTION_SECRET,
		emailUser: process.env.EMAIL_USER,
		emailPass: process.env.EMAIL_PASS,
		devPassphrase: process.env.DEV_PASSPHRASE
	};
}
