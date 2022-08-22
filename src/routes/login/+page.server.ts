import { dev } from '$app/env';
import { variables } from '$lib/env';

import type { User } from '@prisma/client';
import { createUser, getUser } from '$lib/database/users';

import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/words';
import { sendPassphraseEmail } from '$lib/auth';
import { createSessionCookie } from '$lib/session';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/cache';

import { FlowCode } from './_flow';

import type { Action } from './$types';
export const load = async () => {
	const samplePhrase = generatePhrase();
	const sampleEmail = generateEmailAddress();

	return {
		samplePhrase,
		sampleEmail,
		flowCode: FlowCode.Default
	};
};

export const POST: Action = async ({ request, setHeaders }) => {
	const formData = await request.formData();

	const emailEntry = formData.get('email');
	const passphraseEntry = formData.get('passphrase');
	const redirectUrlEntry = formData.get('redirectUrl');

	const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

	if (passphraseEntry == null) {
		const email = emailEntry.toString();

		if (emailEntry) {
			const generatedPassphrase = dev ? variables.devPassphrase : await sendPassphraseEmail(email);

			await setEmailPassphrase(email, generatedPassphrase);

			return {
				location: `?email=${email}&redirectUrl=${redirectUrl}&generated=${true}&flowCode=${
					FlowCode.Generated
				}`
			};
		} else {
			return {
				location: `?redirectUrl=${redirectUrl}&flowCode=${FlowCode.NoEmail}`
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

				setHeaders({
					'set-cookie': cookie
				});

				return {
					location: redirectUrl
				};
			} else {
				return {
					location: `?redirectUrl=${redirectUrl}&flowCode=${FlowCode.BadPassphrase}`
				};
			}
		} else {
			return {
				location: `?redirectUrl=${redirectUrl}&flowCode=${FlowCode.BadEmail}`
			};
		}
	}
};
