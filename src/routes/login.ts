import { serialize } from 'cookie';

/** @type {import('./login').RequestHandler} */
export async function post({ request }: { request: Request }) {
	try {
		const formData = await request.formData();
		const email = formData.get('email').toString();

		// send email

		return {
			status: 201,
			body: {
				message: 'Successfully signed in'
			}
		};
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
