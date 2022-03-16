import adverbs from './adverbs.json';
import adjectives from './adjectives.json';
import nouns from './nouns.json';
import names from './names.json';

// except I, O, Q
import alphabet from './alphabet.json';

function selectRandom<T>(options: T[]): T {
	return options[Math.floor(options.length * Math.random())];
}

export function generateEmailAddress(): string {
	return `${selectRandom(names)}@pierogis.live`;
}

export function generatePhrase(): string {
	return `${selectRandom(adverbs)}-${selectRandom(adjectives)}-${selectRandom(nouns)}`;
}

export function generateSerial(): string {
	const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

	const serial = [
		selectRandom(alphabet),
		selectRandom(alphabet),
		selectRandom(alphabet),
		selectRandom(digits),
		selectRandom(digits),
		selectRandom(digits),
		selectRandom(digits)
	];

	return serial.join('');
}
