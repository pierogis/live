<script lang="ts">
	import { setContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	import { themeKey, syncThemeAction, Theme } from '../theme';

	const storedTheme: Writable<Theme | null> = writable();

	setContext(themeKey, storedTheme);
</script>

<svelte:head>
	{@html `
	<script>
		let theme = (() => {
		  if (
			typeof localStorage !== "undefined" &&
			localStorage.getItem('${themeKey}')
		  ) {
			return localStorage.getItem('${themeKey}');
		  }
		  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
			return "${Theme.Dark}";
		  }
		  return "${Theme.Light}";
		})();
		document.documentElement.dataset.theme = theme;
	</script>
	`}
</svelte:head>

<svelte:window use:syncThemeAction={{ storedTheme }} />

<slot />
