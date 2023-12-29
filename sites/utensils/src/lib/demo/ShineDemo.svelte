<script lang="ts">
	import { Card, Divider, ImageDisplay, Shine } from '@pierogis/utensils';

	let usingRandomLength = true;
	let usingRandomStart = true;

	let maxXLength = 8;
	let maxYLength = 8;
	let minXLength = 6;
	let minYLength = 6;
	let offsetX = 0;
	let offsetY = 0;
	let lengthX = 6;
	let lengthY = 6;
	let blur = 50;
	let color = '#ffffff';
	let unhoverOpacity = 0.5;

	$: {
		if (minXLength > maxXLength) {
			minXLength = maxXLength;
		}
		if (minYLength > maxYLength) {
			minYLength = maxYLength;
		}
		if (offsetX > maxXLength && usingRandomLength) {
			offsetX = maxXLength;
		}
		if (offsetY > maxYLength && usingRandomLength) {
			offsetY = maxYLength;
		}
		if (offsetX > lengthX && !usingRandomLength) {
			offsetX = lengthX;
		}
		if (offsetY > lengthY && !usingRandomLength) {
			offsetY = lengthY;
		}
	}
</script>

<Card>
	<span>a <code>Shine</code></span>
	<Shine
		randomLength={{
			x: { min: minXLength, max: maxXLength },
			y: { min: minYLength, max: maxYLength }
		}}
		offset={!usingRandomStart ? { x: offsetX, y: offsetY } : undefined}
		length={!usingRandomLength ? { x: lengthX, y: lengthY } : undefined}
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

	<div class="input-group">
		<label>
			<input type="checkbox" bind:checked={usingRandomLength} />
			use random length
		</label>

		{#if usingRandomLength}
			<label>
				max x length
				<input type="range" min={0} max={10} bind:value={maxXLength} />
				<input class="inset" type="number" min={0} max={10} bind:value={maxXLength} />
			</label>
			<label>
				min x length
				<input type="range" min={0} max={maxXLength} bind:value={minXLength} />
				<input class="inset" type="number" min={0} max={maxXLength} bind:value={minXLength} />
			</label>
			<label>
				max y length
				<input type="range" min={0} max={10} bind:value={maxYLength} />
				<input class="inset" type="number" min={0} max={10} bind:value={maxYLength} />
			</label>
			<label>
				min y length
				<input type="range" min={0} max={maxYLength} bind:value={minYLength} />
				<input class="inset" type="number" min={0} max={maxYLength} bind:value={minYLength} />
			</label>
		{:else}
			<label>
				x length
				<input type="range" min={0} max={10} bind:value={lengthX} />
				<input class="inset" type="number" min={0} max={10} bind:value={lengthX} />
			</label>
			<label>
				y length
				<input type="range" min={0} max={10} bind:value={lengthY} />
				<input class="inset" type="number" min={0} max={10} bind:value={lengthY} />
			</label>
		{/if}
	</div>

	<Divider horizontal margin="0" />

	<div class="input-group">
		<label>
			<input type="checkbox" bind:checked={usingRandomStart} />
			use random offset
		</label>

		{#if !usingRandomStart}
			<label>
				start x offset
				<input
					type="range"
					min={0}
					max={usingRandomLength ? maxXLength : lengthX}
					bind:value={offsetX}
				/>
				<input
					class="inset"
					type="number"
					min={0}
					max={usingRandomLength ? maxXLength : lengthX}
					bind:value={offsetX}
				/>
			</label>
			<label>
				start y offset
				<input
					type="range"
					min={0}
					max={usingRandomLength ? maxYLength : lengthY}
					bind:value={offsetY}
				/>
				<input
					class="inset"
					type="number"
					min={0}
					max={usingRandomLength ? maxYLength : lengthY}
					bind:value={offsetY}
				/>
			</label>
		{/if}
	</div>

	<Divider horizontal margin="0" />

	<div class="input-group">
		<label>
			unhover opacity
			<input type="range" min={0} max={1} step={0.1} bind:value={unhoverOpacity} />
			<input class="inset" type="number" min={0} max={1} step={0.1} bind:value={unhoverOpacity} />
		</label>

		<label>
			<span>blur</span>
			<input type="range" bind:value={blur} />
			<input class="inset" type="number" bind:value={blur} />
		</label>

		<label>
			<span>color</span>
			<input type="color" bind:value={color} />
		</label>
	</div>
</Card>

<style>
	input[type='number'] {
		width: 4em;
	}
	input[type='range'] {
		width: 3em;
	}
	input[type='color'] {
		width: 3em;
		height: 3em;
	}

	label:has(input) {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	label:has(input[type='checkbox']) {
		justify-content: center;
	}

	label > span {
		font-family: Courier, monospace;
	}

	.input-group {
		width: 90%;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
