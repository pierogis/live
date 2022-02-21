import type { Plate } from './plates';

const plates: Plate[] = [
	{ id: 0, state: 'OH', startYear: 2012, endYear: 2015 },
	{ id: 1, state: 'NY', startYear: 2012, endYear: 2015 },
	{ id: 2, state: 'NV', startYear: 2012, endYear: 2015 },
	{ id: 3, state: 'NH', startYear: 2012, endYear: 2015 },
	{ id: 4, state: 'NJ', startYear: 2012, endYear: 2015 }
];

export function create(request) {}

export function list() {
	return plates;
}

export async function get(params: { id: string }) {
	const id = parseInt(params.id);
	return plates.find((plate) => plate.id == id);
}
