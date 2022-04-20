import { createClient } from 'redis';
import type { RedisClientType } from '@node-redis/client';

import { variables } from '$lib/env';
import { encrypt, decrypt } from './encryption';

export let cache: RedisClientType;

const keyPrefix = 'emporium:';

export async function setupCache() {
	cache = createClient({
		url: variables.cacheUrl
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
	await cache.multi().set(key, value).expire(key, 60).exec();
}

export async function getEmailPassphrase(email: string): Promise<string> {
	const key = getPassphraseKey(email);
	const value = await cache.getDel(key);
	return await decrypt(value);
}
