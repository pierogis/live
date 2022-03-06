import nodemailer from 'nodemailer';

import { variables } from '$lib/env';
import { generatePhrase } from './words';

export async function sendEmail(email: string): Promise<string> {
	const generatedPassword = generatePhrase();
	// send email with generated password
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
		subject: 'generated password', // Subject line
		text: generatedPassword, // plain text body
		html: `<b>${generatedPassword}</b>` // html body
	});

	return generatedPassword;
}
