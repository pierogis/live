import { dev } from '$app/env';
import { variables } from '$lib/env';

import { createUser, getUser } from '$lib/database/users';
import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/words';
import { sendPassphraseEmail } from '$lib/auth';
import { createSessionCookie } from '$lib/session';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/cache';

/** @type {import('./login/index').RequestHandler} */
export async function get() {
	const samplePhrase = generatePhrase();
	const sampleEmail = generateEmailAddress();

	return {
		body: {
			samplePhrase,
			sampleEmail
		}
	};
}

/** @type {import('./login/index').RequestHandler} */
export async function post({ request }: { request: Request }) {
	const formData = await request.formData();

	const emailEntry = formData.get('email');
	const passphraseEntry = formData.get('passphrase');

	if (passphraseEntry == null) {
		const email = emailEntry.toString();

		if (emailEntry) {
			const generatedPassphrase = dev ? variables.devPassphrase : await sendPassphraseEmail(email);

			await setEmailPassphrase(email, generatedPassphrase);

			return {
				status: 200,
				body: {
					email: email,
					generated: true,
					flowCode: 1
				}
			};
		} else {
			return {
				status: 400,
				body: {
					flowCode: 0
				}
			};
		}
	} else {
		const email = emailEntry.toString();
		const passphrase = passphraseEntry.toString();

		const correctPassphrase = await getEmailPassphrase(email);

		if (correctPassphrase) {
			if (correctPassphrase == passphrase.toString()) {
				let user = await getUser({ email });
				if (!user) {
					user = await createUser({ email, serial: generateSerial().toUpperCase() });
				}

				const cookie = await createSessionCookie({ userId: user.id });

				return {
					status: 303,
					headers: {
						'set-cookie': cookie,
						location: '/plates'
					},
					body: {
						flowCode: 4
					}
				};
			} else {
				return {
					status: 401,
					body: {
						flowCode: 2
					}
				};
			}
		} else {
			return {
				status: 401,
				body: {
					flowCode: 3
				}
			};
		}
	}
}
