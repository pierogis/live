<script lang="ts">
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';

	import { Theme, storedThemeContextKey } from './theme';

	const storedTheme: Writable<Theme | null> = getContext(storedThemeContextKey);

	function toggleTheme(theme: Theme) {
		$storedTheme = theme;
	}

	function removeTheme() {
		$storedTheme = null;
	}
</script>

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
	/* little hack to prevent display before dark mode is ready in local storage */
	:global(body[data-no-js]) button {
		display: none;
	}

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
