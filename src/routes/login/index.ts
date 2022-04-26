import { dev } from '$app/env';
import { variables } from '$lib/env';

import type { User } from '@prisma/client';
import { createUser, getUser } from '$lib/database/users';

import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/words';
import { sendPassphraseEmail } from '$lib/auth';
import { createSessionCookie } from '$lib/session';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/cache';

import { FlowCode } from './_flow';

/** @type {import('./login/index').RequestHandler} */
export async function get() {
	const samplePhrase = generatePhrase();
	const sampleEmail = generateEmailAddress();

	return {
		body: {
			samplePhrase,
			sampleEmail,
			flowCode: FlowCode.default
		}
	};
}

/** @type {import('./login/index').RequestHandler} */
export async function post({ request }) {
	const formData = await request.formData();

	const emailEntry = formData.get('email');
	const passphraseEntry = formData.get('passphrase');
	const redirectUrlEntry = formData.get('redirectUrl');

	const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : null;

	if (passphraseEntry == null) {
		const email = emailEntry.toString();

		if (emailEntry) {
			const generatedPassphrase = dev ? variables.devPassphrase : await sendPassphraseEmail(email);

			await setEmailPassphrase(email, generatedPassphrase);

			return {
				status: 200,
				body: {
					email,
					redirectUrl,
					generated: true,
					flowCode: FlowCode.generated
				}
			};
		} else {
			return {
				status: 400,
				body: {
					redirectUrl,
					flowCode: FlowCode.noEmail
				}
			};
		}
	} else {
		const email = emailEntry.toString();
		const passphrase = passphraseEntry.toString();

		const correctPassphrase = await getEmailPassphrase(email);

		if (correctPassphrase) {
			if (correctPassphrase == passphrase.toString()) {
				let user: User = await getUser({ email });
				if (!user) {
					user = await createUser({ email, serial: generateSerial().toUpperCase() });
				}

				const cookie = await createSessionCookie({ userId: user.id });

				return {
					status: 303,
					headers: {
						'set-cookie': cookie,
						location: redirectUrl || '/plates'
					},
					body: {
						flowCode: FlowCode.signedIn
					}
				};
			} else {
				return {
					status: 401,
					body: {
						redirectUrl,
						flowCode: FlowCode.badPassphrase
					}
				};
			}
		} else {
			return {
				status: 401,
				body: {
					redirectUrl,
					flowCode: FlowCode.badEmail
				}
			};
		}
	}
}
