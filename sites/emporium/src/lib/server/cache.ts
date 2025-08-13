import { encrypt, decrypt } from './encryption';

const keyPrefix = 'emporium:';

function getPassphraseKey(email: string) {
	return `${keyPrefix}passphrases:${email}`;
}

export async function setEmailPassphrase(
	kv_binding: KVNamespace,
	email: string,
	passphrase: string
) {
	const key = getPassphraseKey(email);
	const value = await encrypt(passphrase);
	await kv_binding.put(key, value, { expirationTtl: 120 });
}

export async function getEmailPassphrase(
	kv_binding: KVNamespace,
	email: string
): Promise<string | undefined> {
	const key = getPassphraseKey(email);
	const value = await kv_binding.get(key);
	await kv_binding.delete(key);
	if (value != null) {
		return await decrypt(value);
	} else {
		return undefined;
	}
}
