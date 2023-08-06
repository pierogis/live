// const { subtle } = globalThis.crypto;

import { ENCRYPTION_SECRET } from '$env/static/private';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8');

const iterations = 1000;
const hash = 'SHA-256';
const salt = 'salt string for fun';

const baseKey = await crypto.subtle.importKey(
	'raw',
	encoder.encode(ENCRYPTION_SECRET),
	{ name: 'PBKDF2' },
	false,
	['deriveKey']
);

const key = await crypto.subtle.deriveKey(
	{
		name: 'PBKDF2',
		salt: encoder.encode(salt),
		iterations: iterations,
		hash: hash
	},
	baseKey,
	{
		name: 'AES-GCM',
		length: 128
	}, // key type we want
	true, // extractable
	['encrypt', 'decrypt'] // new key usages
);

export const encrypt = async <T>(data: T): Promise<string> => {
	const buffer = encoder.encode(JSON.stringify(data));
	const encrptedBuffer = await crypto.subtle.encrypt(
		{
			name: 'AES-GCM',
			iv: crypto.getRandomValues(new Uint8Array(12))
		},
		key,
		buffer
	);
	return decoder.decode(encrptedBuffer);
};

export const decrypt = async <T>(encryptedData: string): Promise<T> => {
	const encrptedBuffer = encoder.encode(encryptedData);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{
			name: 'AES-GCM',
			iv: crypto.getRandomValues(new Uint8Array(12))
		},
		key,
		encrptedBuffer
	);
	return JSON.parse(decoder.decode(decryptedBuffer));
};
