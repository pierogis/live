import Iron from '@hapi/iron';

import { variables } from './env';

export async function encrypt(data): Promise<string> {
	return data && Iron.seal(data, variables.encryptionSecret, Iron.defaults);
}

export async function decrypt<T>(data: string): Promise<T> {
	return data && Iron.unseal(data, variables.encryptionSecret, Iron.defaults);
}
