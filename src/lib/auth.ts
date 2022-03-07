import nodemailer from 'nodemailer';

import { variables } from '$lib/env';
import { generatePhrase } from './words';

export async function sendEmail(email: string): Promise<string> {
	const generatedPassphrase = generatePhrase();
	// send email with generated passphrase
	const transporter = nodemailer.createTransport({
		host: 'smtp-relay.sendinblue.com',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: variables.emailUser,
			pass: variables.emailPass
		}
	});

	// send mail with defined transport object
	const info = await transporter.sendMail({
		from: '"Karlbot" <no-reply@pierogis.live>', // sender address
		to: email, // list of receivers
		subject: 'generated passphrase', // Subject line
		text: generatedPassphrase, // plain text body
		html: `<b>${generatedPassphrase}</b>` // html body
	});

	return generatedPassphrase;
}
