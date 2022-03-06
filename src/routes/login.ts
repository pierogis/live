import { dev } from '$app/env';
import { createUser, getUser } from '$lib/database/users';
import { sendEmail } from '$lib/words';
import { createSessionCookie } from '$lib/session';

let passwords = {};
/** @type {import('./login').RequestHandler} */
export async function post({ request }: { request: Request }) {
	try {
		const formData = await request.formData();

		const email = dev ? 'kyle@pierogis.live' : formData.get('email').toString();
		const password = formData.get('password').toString();

		if (password == '') {
			const generatedPassword = dev ? 'kitty' : await sendEmail(email);

			passwords[email] = generatedPassword;

			return {
				status: 201,
				body: {
					message: `Generated password emailed to ${email}`
				}
			};
		} else {
			if (email in passwords) {
				if (passwords[email] == password) {
					let user = await getUser({ email });
					if (!user) {
						user = await createUser({ email });
					}

					const cookie = await createSessionCookie(user);

					return {
						status: 201,
						headers: {
							'set-cookie': cookie
						},
						body: {
							message: 'Signed in'
						}
					};
				} else {
					return {
						status: 201,
						body: {
							message: 'Wrong password'
						}
					};
				}
			} else {
				return {
					status: 201,
					body: {
						message: 'Wrong email'
					}
				};
			}
		}
	} catch (error) {
		console.error(error);
		return {
			status: 500,
			body: {
				error: {
					message: 'Internal Server Error'
				}
			}
		};
	}
}
