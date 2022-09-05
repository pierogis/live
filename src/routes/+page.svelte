<script lang="ts">
	import { colorsStore, paletteStore } from './_store';

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
</script>

<div class="content">
	<form>
		<textarea type="text" bind:value={$paletteStore} />
		<button type="submit" on:click|preventDefault={handleImport}>import</button>
	</form>
	<br />
	<div class="colors">
		{#each $colorsStore as color, i}
			<div class="color-container">
				<div class="color" style:background-color="#{color}">
					<span class="remove" on:click|preventDefault={() => handleRemoveColor(i)}>x</span>
				</div>
				<input class="color-input" bind:value={color} />
			</div>
		{/each}
	</div>

	<br />
	<div class="color-container">
		<button type="submit" on:click|preventDefault={handleAddColor}>+</button>
	</div>

	<br />
	{#if $colorsStore.length > 0}
		<button type="submit" on:click|preventDefault={handleExport}>export</button>
	{/if}
</div>

<style>
	.content {
		padding: 4rem;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.colors {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		gap: 1rem;
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

		border-radius: 8px;
	}
	.color-input {
		width: 3rem;
	}
	.remove {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;

		color: white;
		cursor: pointer;
	}
</style>
