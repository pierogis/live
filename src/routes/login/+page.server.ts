import { fail, redirect } from '@sveltejs/kit';

import { dev } from '$app/environment';
import { DEV_PASSPHRASE } from '$env/static/private';

import { createUser, getSessionUser } from '$lib/server/database/users';
import { generatePhrase, generateEmailAddress, generateSerial } from '$lib/server/words';
import { createPassphraseEmail } from '$lib/server/email';
import { requestMailerSend } from '$lib/server/mailersend';
import { setSessionCookie } from '$lib/server/session';
import { getEmailPassphrase, setEmailPassphrase } from '$lib/server/cache';

import { FlowCode } from './_flow';

export const load = async () => {
	const samplePhrase = generatePhrase();
	const sampleEmail = generateEmailAddress();

	return {
		samplePhrase,
		sampleEmail
	};
};

export const actions = {
	generate: async (event) => {
		const formData = await event.request.formData();

		const emailEntry = formData.get('email');

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		if (emailEntry) {
			const originalEmail = emailEntry.toString();

			// use dev passphrase in dev
			const generatedPassphrase = dev ? DEV_PASSPHRASE : generatePhrase();
			const content = createPassphraseEmail(originalEmail, generatedPassphrase);
			// only send email in prod
			dev ?? (await requestMailerSend(originalEmail, content, event.fetch));

			await setEmailPassphrase(originalEmail, generatedPassphrase);

			return {
				redirectUrl,
				originalEmail,
				generated: true,
				flowCode: FlowCode.Generated
			};
		} else {
			return fail(400, {
				redirectUrl,
				originalEmail: '',
				generated: false,
				flowCode: FlowCode.NoEmail
			});
		}
	},
	login: async (event) => {
		const formData = await event.request.formData();

		const email = formData.get('email')?.toString();
		const passphrase = formData.get('passphrase')?.toString();

		if (!email || !passphrase) {
			return fail(400);
		}

		const correctPassphrase = await getEmailPassphrase(email);

		const redirectUrlEntry = formData.get('redirectUrl');
		const redirectUrl = redirectUrlEntry ? redirectUrlEntry.toString() : '/';

		if (correctPassphrase) {
			if (correctPassphrase == passphrase.toString()) {
				let user = await getSessionUser({ email });
				if (!user) {
					user = await createUser({ email, serial: generateSerial().toUpperCase() });
				}

				await setSessionCookie(event.cookies, { userId: user.id });

				throw redirect(303, redirectUrl);
			} else {
				return fail(400, {
					redirectUrl,
					originalEmail: email,
					generated: false,
					flowCode: FlowCode.BadPassphrase
				});
			}
		} else {
			return fail(400, {
				redirectUrl,
				originalEmail: email,
				generated: true,
				flowCode: FlowCode.BadEmail
			});
		}
	},
	need: async (event) => {
		const formData = await event.request.formData();

		const originalEmail = formData.get('email')?.toString();

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

		const originalEmail = emailEntry?.toString();

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
