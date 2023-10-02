export function createPassphraseEmail(email: string, generatedPassphrase: string) {
	const text = `hello ${email},
		\n
		\n
		this is your one time passphrase:
		\n
		${generatedPassphrase}
		\n
		it will be valid for 2 minute
	`;

	const html = `hello <i>${email}</i>,
		<br>
		<br>
		this is your one time passphrase:
		<br>
		<b>${generatedPassphrase}</b>
		<br>
		it will be valid for 2 minutes
	`;

	return { text, html };
}
