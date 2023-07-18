<script lang="ts">
	import { Card, ImageDisplay, Shine } from '$lib';

	let usingRandomLength = true;
	let usingRandomStart = true;

	let maxLength = 8;
	let minLength = 6;
	let offset = 0;
	let length = 6;
	let blur = 50;
	let color = '#ffffff';
	let unhoverOpacity = 0.5;

	$: {
		if (minLength > maxLength) {
			minLength = maxLength;
		}
		if (offset > maxLength && usingRandomLength) {
			offset = maxLength;
		}
		if (offset > length && !usingRandomLength) {
			offset = length;
		}
	}
</script>

<Card>
	<span>a <code>Shine</code></span>
	<Shine
		randomLength={{ min: minLength, max: maxLength }}
		offset={!usingRandomStart ? offset : undefined}
		length={!usingRandomLength ? length : undefined}
		blur="{blur}px"
		{color}
		{unhoverOpacity}
	>
		<ImageDisplay
			width="200px"
			height="100px"
			urls={[
				'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
			]}
			alt="hello!"
		/>
	</Shine>
	<span>can cover anything in an undulating sheen</span>
	<span>(try hovering too)</span>

	<label>
		<input type="checkbox" bind:checked={usingRandomLength} />
		use random length
	</label>

	{#if usingRandomLength}
		<label>
			max length
			<input type="range" min={0} max={10} bind:value={maxLength} />
			<input class="inset" type="number" min={0} max={10} bind:value={maxLength} />
		</label>
		<label>
			min length
			<input type="range" min={0} max={maxLength} bind:value={minLength} />
			<input class="inset" type="number" min={0} max={maxLength} bind:value={minLength} />
		</label>
	{:else}
		<label>
			length
			<input type="range" min={0} max={10} bind:value={length} />
			<input class="inset" type="number" min={0} max={10} bind:value={length} />
		</label>
	{/if}

	<label>
		<input type="checkbox" bind:checked={usingRandomStart} />
		use random offset
	</label>

	{#if !usingRandomStart}
		<label>
			start offset
			<input
				type="range"
				min={0}
				max={usingRandomLength ? maxLength : length}
				bind:value={offset}
			/>
			<input
				class="inset"
				type="number"
				min={0}
				max={usingRandomLength ? maxLength : length}
				bind:value={offset}
			/>
		</label>
	{/if}

	<label>
		unhover opacity
		<input type="range" min={0} max={1} step={0.1} bind:value={unhoverOpacity} />
		<input class="inset" type="number" min={0} max={1} step={0.1} bind:value={unhoverOpacity} />
	</label>

	<label>
		blur
		<input type="range" bind:value={blur} />
		<input class="inset" type="number" bind:value={blur} />
	</label>

	<label>
		color
		<input type="color" bind:value={color} />
	</label>
</Card>

<style>
	input[type='number'] {
		width: 4rem;
	}
</style>
