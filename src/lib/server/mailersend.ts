import { MAILERSEND_API_KEY } from '$env/static/private';

type Fetch = typeof fetch;

export const requestMailerSend = async (
	to: string,
	content: { text: string; html: string },
	fetch: Fetch
) => {
	const body = {
		from: {
			email: 'no-reply@pierogis.live',
			name: 'karlbot'
		},
		to: [
			{
				email: to
			}
		],
		subject: 'generated passphrase',
		text: content.text,
		html: content.html
	};

	const response = await fetch('https://api.mailersend.com/v1', {
		method: 'POST',
		body: JSON.stringify(body),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${MAILERSEND_API_KEY}`
		}
	});

	if (response.status !== 202) {
		const { message } = await response.json();
		console.error(message);
		throw 'error sending one time passphrase';
	}
};
