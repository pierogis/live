import nodemailer from 'nodemailer';

import { EMAIL_PASS, EMAIL_USER } from '$env/static/private';
import { generatePhrase } from './words';

export async function sendPassphraseEmail(email: string): Promise<string> {
	const generatedPassphrase = generatePhrase();

	// send email with generated passphrase
	const transporter = nodemailer.createTransport({
		host: 'smtp-relay.sendinblue.com',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: EMAIL_USER,
			pass: EMAIL_PASS
		}
	});

	// send mail with defined transport object
	await transporter.sendMail({
		from: '"karlbot" <no-reply@pierogis.live>',
		to: email,
		subject: 'generated passphrase',
		text: `hello ${email},
			\n
			\n
			this is your one time passphrase:
			\n
			${generatedPassphrase}
			\n
			it will be valid for 2 minute
		`,
		html: `hello <i>${email}</i>,
			<br>
			<br>
			this is your one time passphrase:
			<br>
			<b>${generatedPassphrase}</b>
			<br>
			it will be valid for 2 minutes
		`
	});

	return generatedPassphrase;
}
