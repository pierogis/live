import crypto from 'crypto';

import { ENCRYPTION_SECRET } from '$env/static/private';

// largely borrowed from https://github.com/pilcrowOnPaper/lucia-sveltekit/blob/4d542bba5791bb1bc967d6bf59af94e17ab81dd8/packages/lucia-sveltekit/src/utils/crypto.ts

const algorithm = 'aes-192-cbc';
const key = crypto.scryptSync(ENCRYPTION_SECRET, 'salt', 24);

export function encrypt<T>(data: T): string {
	const stringData = JSON.stringify(data);

	const iv = crypto.randomBytes(16);
	const cipher = crypto.createCipheriv(algorithm, key, iv);
	const encrypted = cipher.update(stringData, 'utf8', 'hex');
	return [encrypted + cipher.final('hex'), Buffer.from(iv).toString('hex')].join('.');
}

export function decrypt<T>(encryptedData: string): T {
	const [encrypted, iv] = encryptedData.split('.');
	if (!iv) throw new Error('IV not found');
	const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(iv, 'hex'));
	return JSON.parse(decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8'));
}
