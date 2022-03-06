import { readFileSync } from 'fs';
import nodemailer from 'nodemailer';

import { variables } from '$lib/env';

let adverbs: string[];
let adjectives: string[];
let nouns: string[];

let names: string[];
let alphabet: string[];

export function generatePhrase(): string {
	adverbs = adverbs || readFileLines('static/words/adverbs.json');
	adjectives = adjectives || readFileLines('static/words/adjectives.json');
	nouns = nouns || readFileLines('static/words/nouns.json');

	return `${adverbs[Math.floor(adverbs.length * Math.random())]}-${
		adjectives[Math.floor(adjectives.length * Math.random())]
	}-${nouns[Math.floor(nouns.length * Math.random())]}`;
}

export function generateName(): string {
	names = names || readFileLines('static/words/names.json');
	alphabet = alphabet || readFileLines('static/words/alphabet.json');

	return `${names[Math.floor(names.length * Math.random())]} ${alphabet[
		Math.floor(alphabet.length * Math.random())
	].toUpperCase()}.`;
}

function readFileLines(path: string): string[] {
	const json = readFileSync(path, 'utf8');

	return JSON.parse(json);
}

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
