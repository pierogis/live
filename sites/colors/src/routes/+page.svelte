<script lang="ts">
	import { Interactable, SEO } from '@pierogis/utensils';
	import { writable, type Writable } from 'svelte/store';

	export let data;
	$: ({ canonical, title, description } = data);

	function handleImport() {
		$colorsStore = $paletteStore.split(' ');
	}

	function handleAddColor() {
		$colorsStore = [...$colorsStore, '000000'];
	}

	function handleRemoveColor(i: number) {
		$colorsStore.splice(i, 1);
		$colorsStore = $colorsStore;
	}

	function handleExport() {
		$paletteStore = $colorsStore.join(' ');
	}

	const defaultColors = ['e18c96', '8ccde1'];
	const defaultPalette = defaultColors.join(' ');
	const colorsStore: Writable<string[]> = writable(defaultColors);
	const paletteStore: Writable<string> = writable(defaultPalette);

	function palette(window: Window) {
		const storedPalette = window.localStorage.getItem('palette');
		if (storedPalette) $paletteStore = storedPalette;

		const storedColors = window.localStorage.getItem('colors');
		if (storedColors) $colorsStore = JSON.parse(storedColors);

		paletteStore.subscribe((palette) => {
			window.localStorage.setItem('palette', palette);
		});
		colorsStore.subscribe((colors) => {
			window.localStorage.setItem('colors', JSON.stringify(colors));
		});
	}
</script>

<svelte:window use:palette />

<svelte:head>
	<SEO {canonical} {title} {description} type="website" />
</svelte:head>

<div class="content">
	<form>
		<textarea class="inset" rows="6" bind:value={$paletteStore} />
		<br />
		<div class="import-export">
			<Interactable>
				<button class="border inset link-box" type="submit" on:click|preventDefault={handleImport}>
					import ↓
				</button>
			</Interactable>

			{#if $colorsStore.length > 0}
				<Interactable>
					<button
						class="border inset link-box"
						type="submit"
						on:click|preventDefault={handleExport}
					>
						export ↑
					</button>
				</Interactable>
			{/if}
		</div>
	</form>

	<Interactable>
		<button
			class="border inset link-box good"
			type="submit"
			on:click|preventDefault={handleAddColor}
		>
			+
		</button>
	</Interactable>

	<div class="colors">
		{#each $colorsStore as color, i}
			<div class="color-container">
				<div class="color" style:background-color="#{color}">
					<button class="remove" type="submit" on:click|preventDefault={() => handleRemoveColor(i)}>
						x
					</button>
				</div>
				<input class="color-input inset" type="text" bind:value={color} />
			</div>
		{/each}
	</div>
</div>

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
	}
	.colors {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1rem;

		max-width: 90vw;
	}
	.color-container {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;

		gap: 1rem;
	}
	.color {
		position: relative;
		height: 4rem;
		width: 4rem;

		border: 2px dotted var(--text-color);
		border-radius: 8px;
	}
	.color-input {
		width: 5em;
		text-align: center;
	}
	.import-export {
		display: flex;
		flex-direction: row;

		gap: 1rem;
	}
	.import-export > * {
		flex: 1 1 0px;
	}
	.remove {
		position: absolute;
		top: 0.3rem;
		right: 0.4rem;

		background-color: transparent;
		color: white;
		cursor: pointer;
	}

	form {
		display: flex;
		flex-direction: column;
	}
</style>
