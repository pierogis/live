import { encrypt, decrypt } from './encryption';

function getPassphraseKey(email: string) {
	return `passphrases:${email}`;
}

export async function setEmailPassphrase(
	platform: App.Platform,
	email: string,
	passphrase: string
) {
	const key = getPassphraseKey(email);
	const value = await encrypt(passphrase);

	platform.env.EMPORIUM_KV;
	await cache.multi().set(key, value).expire(key, 120).exec();
}

export async function getEmailPassphrase(
	platform: App.Platform,
	email: string
): Promise<string | undefined> {
	const key = getPassphraseKey(email);
	const value = await cache.getDel(key);
	if (value != null) {
		return await decrypt(value);
	} else {
		return undefined;
	}
}
