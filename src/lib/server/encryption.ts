import Iron from '@hapi/iron';

import { ENCRYPTION_SECRET } from '$env/static/private';

export async function encrypt<T>(data: T): Promise<string> {
	return data && Iron.seal(data, ENCRYPTION_SECRET, Iron.defaults);
}

export async function decrypt<T>(sealed: string): Promise<T> {
	return Iron.unseal(sealed, ENCRYPTION_SECRET, Iron.defaults);
}
