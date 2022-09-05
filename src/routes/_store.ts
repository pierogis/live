import { writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';

export const paletteStore: Writable<string> = writable(
	browser ? localStorage.getItem('palette') || '' : ''
);
export const colorsStore: Writable<string[]> = writable(
	browser ? (localStorage.getItem('colors') ? JSON.parse(localStorage.getItem('colors')) : []) : []
);

paletteStore.subscribe((palette) => {
	if (browser) {
		localStorage.setItem('palette', palette);
	}
});
colorsStore.subscribe((colors) => {
	if (browser) {
		localStorage.setItem('colors', JSON.stringify(colors));
	}
});
