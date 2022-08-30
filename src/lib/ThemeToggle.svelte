<script lang="ts">
	import { derived, writable, type Writable } from 'svelte/store';

	enum Theme {
		Light = 'Light',
		Dark = 'Dark'
	}

	function toggleTheme(theme: Theme) {
		$storedTheme = theme;
	}

	function removeTheme() {
		$storedTheme = null;
	}

	const storedTheme: Writable<Theme | null> = writable();
	const osTheme: Writable<Theme> = writable(Theme.Light);

	const theme = derived([storedTheme, osTheme], ([$storedTheme, $osTheme]) => {
		if ($storedTheme) {
			return $storedTheme;
		} else {
			return $osTheme;
		}
	});

	function syncTheme(window: Window) {
		$storedTheme = localStorage.getItem('theme') as Theme;

		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
			if (event.matches) {
				$osTheme = Theme.Dark;
			} else {
				$osTheme = Theme.Light;
			}
		});

		storedTheme.subscribe(($storedTheme) => {
			if ($storedTheme) {
				window.localStorage.setItem('theme', $storedTheme);
			} else {
				window.localStorage.removeItem('theme');
			}
		});

		theme.subscribe(($currentTheme) => {
			document.documentElement.setAttribute('data-theme', $currentTheme);
		});
	}
</script>

<svelte:window use:syncTheme />

<div class="link-box">
	<div class="holder">
		<button
			class="light"
			class:stored={$storedTheme == Theme.Light}
			on:click={() => {
				if ($storedTheme == Theme.Light) {
					removeTheme();
				} else {
					toggleTheme(Theme.Light);
				}
			}}
		/>
		<button
			class="dark"
			class:stored={$storedTheme == Theme.Dark}
			on:click={() => {
				if ($storedTheme == Theme.Dark) {
					removeTheme();
				} else {
					toggleTheme(Theme.Dark);
				}
			}}
		/>
	</div>
</div>

<style>
	.link-box {
		display: flex;
		place-items: center;
	}
	.holder {
		position: relative;
		display: flex;
		place-items: center;

		height: 0.6rem;
		width: 36px;

		background-color: var(--primary-color);
	}
	button {
		position: absolute;
		height: 1.4rem;
		width: 1.4rem;

		border-radius: 50%;
	}
	.light {
		left: -8px;
		background-color: var(--light-color);
		border: dotted var(--secondary-color) 3px;
	}
	.dark {
		right: -8px;
		background-color: var(--dark-color);
		border: dotted var(--secondary-color) 3px;
	}
	.stored {
		border: solid var(--secondary-color) 3px;
	}
</style>
