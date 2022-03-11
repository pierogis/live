import { dev } from '$app/env';

import { variables } from '$lib/env';
import { createUser, getUser } from '$lib/database/users';
import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/words';

import { createSessionCookie } from '$lib/session';
import { sendEmail } from '$lib/auth';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/cache';

/** @type {import('./login').RequestHandler} */
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

/** @type {import('./login').RequestHandler} */
export async function post({ request }: { request: Request }) {
	const formData = await request.formData();

	const emailEntry = formData.get('email');
	const passphraseEntry = formData.get('passphrase');

	if (passphraseEntry == null) {
		const email = emailEntry.toString();

		if (emailEntry) {
			const generatedPassphrase = dev ? variables.devPassphrase : await sendEmail(email);

			await setEmailPassphrase(email, generatedPassphrase);

			return {
				status: 200,
				body: {
					email: email,
					generated: true,
					good: true,
					message: `Generated passphrase emailed to ${email}`
				}
			};
		} else {
			return {
				status: 400,
				body: {
					good: false,
					message: 'Email required'
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
					user = await createUser({ email, serial: generateSerial() });
				}

				const cookie = await createSessionCookie({ userId: user.id });

				return {
					status: 303,
					headers: {
						'set-cookie': cookie,
						location: '/plates'
					},
					body: {
						message: 'Signed in'
					}
				};
			} else {
				return {
					status: 401,
					body: {
						good: false,
						message: 'Wrong passphrase'
					}
				};
			}
		} else {
			return {
				status: 401,
				body: {
					good: false,
					message: 'Wrong email'
				}
			};
		}
	}
}
