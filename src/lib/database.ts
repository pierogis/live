import type { Plate } from './plates';

const plates: Plate[] = [
	{
		id: 0,
		state: 'OH',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 4.5, identifiability: 5 }
	},
	{
		id: 1,
		state: 'NY',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 3.2, identifiability: 5 }
	},
	{
		id: 2,
		state: 'NV',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 4, identifiability: 5 }
	},
	{
		id: 3,
		state: 'NH',
		startYear: 2012,
		endYear: 2015,
		scores: { overall: 2, identifiability: 5 }
	},
	{ id: 4, state: 'NJ', startYear: 2012, endYear: 2015, scores: { overall: 4, identifiability: 5 } }
];

export function create(request) {}

export function list() {
	return plates;
}

export async function get(params: { id?: number; state?: string }) {
	let keys = Object.keys(params);
	return plates.find((plate) => {
		return keys.every((key) => {
			return plate[key] == params[key];
		});
	});
}
