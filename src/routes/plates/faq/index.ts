/** @type {import('/plates/faq').RequestHandler} */
export async function get() {
	const questions: { question: String; answer: String }[] = [
		{
			question: `What do the score categories mean?`,
			answer: `overall (🌡️): Overall.

                identifiability (👁️): Some combination of uniqueness and how easy it is to identify on the street.

                colors (🎨): The color palette, rated from a standpoint of appeal to the eye.

                symbols (💫): Poetry, in the sense of what different aspects of the plate might mean (symbolic colors, slogans).

                typeface (🔤): Shapes of letters and digits, both in serial and identification of jurisdiction (for example).

                clarity (👓): The opposite of how confused the entire design is.
            `
		},
		{
			question: `How do you feel about vanity plates (custom, non serial identifiers)?`,
			answer: `They are ok but often tacky. I don't like when they are "funny" and the kind of driver that often dons them doesn't help.`
		},
		{ question: `What is going on with you?`, answer: `Not much how about you?` },
		{
			question: `Why did you make this?`,
			answer: `I get excited when I see out of state license plates wherever I am.`
		},
		{
			question: `What's your favorite color?`,
			answer: `Green.`
		}
	];

	return {
		body: { questions }
	};
}
