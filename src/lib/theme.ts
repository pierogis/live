import type { Readable, Writable } from 'svelte/store';

export enum Theme {
	Light = 'Light',
	Dark = 'Dark'
}

export const storedThemeContextKey = 'storedTheme';

export function syncThemeAction(
	window: Window,
	params: { storedTheme: Writable<Theme | null>; osTheme: Writable<Theme>; theme: Readable<Theme> }
) {
	const { storedTheme, osTheme, theme } = params;

	storedTheme.set(localStorage.getItem('theme') as Theme);

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
		if (event.matches) {
			osTheme.set(Theme.Dark);
		} else {
			osTheme.set(Theme.Light);
		}
	});

	storedTheme.subscribe(($storedTheme) => {
		if ($storedTheme) {
			window.localStorage.setItem('theme', $storedTheme);
		} else {
			window.localStorage.removeItem('theme');
		}
	});

	theme.subscribe(($theme) => {
		document.documentElement.setAttribute('data-theme', $theme);
	});
}
