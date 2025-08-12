import { ENCRYPTION_SECRET } from '$env/static/private';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

const encryptionSecretUtf8 = encoder.encode(ENCRYPTION_SECRET); // encode password as UTF-8
const encryptionSecretHash = await crypto.subtle.digest('SHA-256', encryptionSecretUtf8); // hash the password

export const encrypt = async <T>(data: T): Promise<string> => {
	const iv = crypto.getRandomValues(new Uint8Array(12)); // get 96-bit random iv

	const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use

	const key = await crypto.subtle.importKey('raw', encryptionSecretHash, alg, false, ['encrypt']); // generate key from pw

	const ptUint8 = encoder.encode(JSON.stringify(data)); // encode plaintext as UTF-8
	const ctBuffer = await crypto.subtle.encrypt(alg, key, ptUint8); // encrypt plaintext using key

	return Buffer.from(iv).toString('base64') + Buffer.from(ctBuffer).toString('base64');
};

export const decrypt = async <T>(encryptedData: string): Promise<T> => {
	const encodedbuffer = Buffer.from(encryptedData, 'base64');
	const iv = encodedbuffer.subarray(0, 12);

	const alg = { name: 'AES-GCM', iv: iv }; // specify algorithm to use

	const key = await crypto.subtle.importKey('raw', encryptionSecretHash, alg, false, ['decrypt']); // generate key from pw

	const ct = encodedbuffer.subarray(12); // decode base64 ciphertext

	try {
		const plainBuffer = await crypto.subtle.decrypt(alg, key, new Uint8Array(ct).buffer); // decrypt ciphertext using key
		const plaintext = decoder.decode(plainBuffer); // plaintext from ArrayBuffer
		return JSON.parse(plaintext); // return the plaintext
	} catch {
		throw 'decrypt failed';
	}
};
