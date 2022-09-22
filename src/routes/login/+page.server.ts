import { invalid, redirect } from '@sveltejs/kit';

import type { User } from '@prisma/client';

import { dev } from '$app/environment';

import { createUser, getUser } from '$lib/server/database/users';
import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/server/words';
import { sendPassphraseEmail } from '$lib/server/auth';
import { setSessionCookie } from '$lib/server/session';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/server/cache';

import { FlowCode } from './_flow';

import type { Actions, PageServerLoad } from './$types';
import { DEV_PASSPHRASE } from '$env/static/private';

export const load: PageServerLoad = async () => {
	const samplePhrase = generatePhrase();
	const sampleEmail = generateEmailAddress();

	return {
		samplePhrase,
		sampleEmail
	};
};

export const actions: Actions = {
	generate: async (event) => {
		const formData = await event.request.formData();

		const emailEntry = formData.get('email');

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		if (emailEntry) {
			const originalEmail = emailEntry.toString();
			const generatedPassphrase = dev ? DEV_PASSPHRASE : await sendPassphraseEmail(originalEmail);

			await setEmailPassphrase(originalEmail, generatedPassphrase);

			return {
				redirectUrl,
				originalEmail,
				generated: true,
				flowCode: FlowCode.Generated
			};
		} else {
			return invalid(400, {
				redirectUrl,
				originalEmail: '',
				generated: false,
				flowCode: FlowCode.NoEmail
			});
		}
	},
	login: async (event) => {
		const formData = await event.request.formData();

		const email = formData.get('email').toString();
		const passphrase = formData.get('passphrase').toString();

		const correctPassphrase = await getEmailPassphrase(email);

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		if (correctPassphrase) {
			if (correctPassphrase == passphrase.toString()) {
				let user: User = await getUser({ email });
				if (!user) {
					user = await createUser({ email, serial: generateSerial().toUpperCase() });
				}

				await setSessionCookie(event.cookies, { userId: user.id });

				throw redirect(300, redirectUrl);
			} else {
				return invalid(400, {
					redirectUrl,
					originalEmail: email,
					generated: false,
					flowCode: FlowCode.BadPassphrase
				});
			}
		} else {
			return invalid(400, {
				redirectUrl,
				originalEmail: email,
				generated: true,
				flowCode: FlowCode.BadEmail
			});
		}
	},
	need: async (event) => {
		const formData = await event.request.formData();

		const originalEmail = formData.get('email').toString();

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		return {
			redirectUrl,
			flowCode: undefined,
			generated: false,
			originalEmail
		};
	},
	already: async (event) => {
		const formData = await event.request.formData();

		const emailEntry = formData.get('email');

		const originalEmail = emailEntry.toString();

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		return {
			redirectUrl,
			flowCode: undefined,
			generated: true,
			originalEmail
		};
	}
};
