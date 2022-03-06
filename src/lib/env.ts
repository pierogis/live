import dotenv from 'dotenv';

dotenv.config();

export const variables = {
	databaseUrl: process.env.DATABASE_URL,
	sessionName: 'session',
	sessionLength: parseInt(process.env.SESSION_LENGTH),
	encryptionSecret: process.env.ENCRYPTION_SECRET,
	emailUser: process.env.EMAIL_USER,
	emailPass: process.env.EMAIL_PASS,
	devPassword: process.env.DEV_PASSWORD,
	adminId: parseInt(process.env.ADMIN_ID)
};
