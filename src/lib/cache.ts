import { createClient } from 'redis';

import { variables } from '$lib/env';
import type { RedisClientType } from '@node-redis/client';

export let cache: RedisClientType;

export async function setupCache() {
	cache = createClient({
		url: variables.cacheUrl
	});

	cache.on('error', (err) => console.error(err));

	await cache.connect();
}

function getPassphraseKey(email: string) {
	return `passphrases:${email}`;
}

export async function setEmailPassphrase(email: string, passphrase: string) {
	const key = getPassphraseKey(email);
	await cache.multi().set(key, passphrase).expire(key, 60).exec();
}

export async function getEmailPassphrase(email): Promise<string> {
	const key = getPassphraseKey(email);
	return await cache.get(key);
}
