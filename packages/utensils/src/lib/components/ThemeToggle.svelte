<script lang="ts">
	import { getContext } from 'svelte';
	import { writable, type Writable } from 'svelte/store';

	import { Theme, themeKey } from '../theme';

	interface Props {
		// eslint-disable-next-line svelte/require-store-reactive-access
		storedTheme?: Writable<Theme | null>;
	}

	let { storedTheme = getContext(themeKey) || writable() }: Props = $props();

	function toggleTheme(theme: Theme) {
		$storedTheme = theme;
	}

	function removeTheme() {
		$storedTheme = null;
	}
</script>

<div class="holder">
	<button
		class="light"
		class:stored={$storedTheme == Theme.Light}
		aria-label="light"
		onclick={() => {
			if ($storedTheme == Theme.Light) {
				removeTheme();
			} else {
				toggleTheme(Theme.Light);
			}
		}}
	></button>
	<button
		class="dark"
		class:stored={$storedTheme == Theme.Dark}
		aria-label="dark"
		onclick={() => {
			if ($storedTheme == Theme.Dark) {
				removeTheme();
			} else {
				toggleTheme(Theme.Dark);
			}
		}}
	></button>
</div>

<style>
	/* little hack to prevent display if no js */
	:global(body[data-no-js]) .holder {
		display: none;
	}

	.holder {
		display: flex;
		place-items: center;
		gap: 8px;
		padding: 8px;
		border-radius: 12px;

		background-color: var(--input-color);
		border: solid var(--secondary-color) 2px;
	}
	button {
		height: 28px;
		width: 28px;

		border-radius: 50%;
	}
	.light {
		background-color: var(--light-color);
		border: dotted var(--secondary-color) 3px;
	}
	.dark {
		background-color: var(--dark-color);
		border: dotted var(--secondary-color) 3px;
	}
	.stored {
		border: solid var(--secondary-color) 3px;
	}
</style>
