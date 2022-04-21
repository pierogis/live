import Iron from '@hapi/iron';

import { variables } from './env';

export async function encrypt<T>(data: T): Promise<string> {
	return data && Iron.seal(data, variables.encryptionSecret, Iron.defaults);
}

export async function decrypt<T>(sealed: string): Promise<T> {
	return Iron.unseal(sealed, variables.encryptionSecret, Iron.defaults);
}
