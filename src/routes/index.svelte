<script lang="ts">
	let colorHexes: string;
	let colors: string[] = [];

	function handleClick() {
		console.log(colorHexes);
		colors = colorHexes.split(' ');
	}
</script>

<form>
	<input type="text" bind:value={colorHexes} />
	<button type="submit" on:click|preventDefault={handleClick}>submit</button>
</form>
<br />
<div class="colors">
	{#each colors as color}
		<div class="color-container">
			<div class="color" style:background-color="#{color}" />
			{color}
		</div>
	{/each}
</div>

<style>
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
	}
	.color {
		height: 4rem;
		width: 4rem;
	}
</style>
