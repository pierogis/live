import { encrypt, decrypt } from './encryption';
import type { KVNamespace } from '@cloudflare/workers-types';

function getPassphraseKey(email: string) {
	return `passphrases:${email}`;
}

export async function setEmailPassphrase(kv: KVNamespace, email: string, passphrase: string) {
	const key = getPassphraseKey(email);
	const value = await encrypt(passphrase);

	await kv.put(key, value, { expirationTtl: 120 });
}

export async function getEmailPassphrase(
	kv: KVNamespace,
	email: string
): Promise<string | undefined> {
	const key = getPassphraseKey(email);
	const value = await kv.get(key);
	await kv.delete(key);
	if (value != null) {
		return await decrypt(value);
	} else {
		return undefined;
	}
}
