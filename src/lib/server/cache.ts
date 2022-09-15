import { createClient, type RedisClientType } from 'redis';

import { CACHE_URL } from '$env/static/private';

import { encrypt, decrypt } from './encryption';

export let cache: RedisClientType;

const keyPrefix = 'emporium:';

export async function setupCache() {
	cache = createClient({
		url: CACHE_URL
	});

	cache.on('error', (err) => console.error(err));

	await cache.connect();
}

function getPassphraseKey(email: string) {
	return `${keyPrefix}passphrases:${email}`;
}

export async function setEmailPassphrase(email: string, passphrase: string) {
	const key = getPassphraseKey(email);
	const value = await encrypt(passphrase);
	await cache.multi().set(key, value).expire(key, 120).exec();
}

export async function getEmailPassphrase(email: string): Promise<string | undefined> {
	const key = getPassphraseKey(email);
	const value = await cache.getDel(key);
	if (value != null) {
		return await decrypt(value);
	} else {
		return undefined;
	}
}
