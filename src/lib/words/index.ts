import * as adverbs from './adverbs.json';
import * as adjectives from './adjectives.json';
import * as nouns from './nouns.json';
import * as names from './names.json';

// except I, O, Q
import * as alphabet from './alphabet.json';

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function selectRandom<T>(options: T[]): T {
	return options[Math.floor(options.length * Math.random())];
}

export function generateEmailAddress(): string {
	return `${selectRandom(names)}@pierogis.live`;
}

export function generatePhrase(): string {
	return `${selectRandom(adverbs)}-${selectRandom(adjectives)}-${selectRandom(nouns)}-${[
		selectRandom(digits),
		selectRandom(digits),
		selectRandom(digits),
		selectRandom(digits)
	].join('')}`;
}

export function generateSerial(): string {
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
