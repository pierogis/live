import { readFileSync } from 'fs';

let adverbs: string[];
let adjectives: string[];
let nouns: string[];

let names: string[];
let alphabet: string[];

function readJson(path: string): string[] {
	const json = readFileSync(path, 'utf8');

	return JSON.parse(json);
}

function selectRandom(options: string[]): string {
	return options[Math.floor(options.length * Math.random())];
}

export function generateEmailAddress(): string {
	names = names || readJson('static/words/names.json');

	return `${selectRandom(names)}@pierogis.live`;
}

export function generatePhrase(): string {
	adverbs = adverbs || readJson('static/words/adverbs.json');
	adjectives = adjectives || readJson('static/words/adjectives.json');
	nouns = nouns || readJson('static/words/nouns.json');

	return `${selectRandom(adverbs)}-${selectRandom(adjectives)}-${selectRandom(nouns)}`;
}

export function generateName(): string {
	names = names || readJson('static/words/names.json');
	alphabet = alphabet || readJson('static/words/alphabet.json');

	return `${selectRandom(names)} ${selectRandom(alphabet).toUpperCase()}.`;
}
