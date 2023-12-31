import { derived, writable, type Readable, type Writable } from 'svelte/store';

export enum Theme {
	Light = 'light',
	Dark = 'dark'
}

export const themeKey = 'theme';

export function syncThemeAction(
	window: Window,
	params: {
		storedTheme: Writable<Theme | null>;
		osTheme?: Writable<Theme>;
		theme?: Readable<Theme>;
	}
) {
	const {
		storedTheme,
		osTheme = writable(),
		theme = derived([storedTheme, osTheme], ([$storedTheme, $osTheme]) => {
			if ($storedTheme) {
				return $storedTheme;
			} else {
				return $osTheme;
			}
		})
	} = params;

	storedTheme.set(localStorage.getItem(themeKey) as Theme);

	const matchPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

	if (matchPrefersDark.matches) {
		osTheme.set(Theme.Dark);
	} else {
		osTheme.set(Theme.Light);
	}

	matchPrefersDark.addEventListener('change', (event) => {
		if (event.matches) {
			osTheme.set(Theme.Dark);
		} else {
			osTheme.set(Theme.Light);
		}
	});

	storedTheme.subscribe(($storedTheme) => {
		if ($storedTheme) {
			window.localStorage.setItem(themeKey, $storedTheme);
		} else {
			window.localStorage.removeItem(themeKey);
		}
	});

	theme.subscribe(($theme) => {
		document.documentElement.setAttribute('data-theme', $theme);
	});
}
