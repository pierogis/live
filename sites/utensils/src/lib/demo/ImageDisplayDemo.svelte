<script lang="ts">
	import { Card, ImageDisplay } from '@pierogis/utensils';

	let width = 200;
	let height = 100;
	let widthUnit = 'px';
	let heightUnit = 'px';
</script>

<Card>
	<span>an <code>ImageDisplay</code></span>
	<ImageDisplay
		width={width + widthUnit}
		height={height + heightUnit}
		urls={[
			'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
		]}
		alt="hello!"
	/>
	<span>can definitely display an image wrapped in a border</span>

	<div class="input-group">
		<label>
			width
			<input class="inset" type="number" bind:value={width} />
		</label>

		<div class="radio-group">
			<label>
				<input type="radio" bind:group={widthUnit} name="widthUnit" value={'rem'} />
				rem
			</label>

			<label>
				<input type="radio" bind:group={widthUnit} name="widthUnit" value={'px'} />
				px
			</label>
		</div>
	</div>
	<div class="input-group">
		<label>
			height

			<input class="inset" type="number" bind:value={height} />
		</label>

		<div class="radio-group">
			<label>
				<input type="radio" bind:group={heightUnit} name="heightUnit" value={'rem'} />
				rem
			</label>

			<label>
				<input type="radio" bind:group={heightUnit} name="heightUnit" value={'px'} />
				px
			</label>
		</div>
	</div>
</Card>

<style>
	input[type='number'] {
		width: 4em;
	}
	.input-group {
		display: flex;
		flex-direction: column;
	}
	.radio-group {
		display: flex;
		justify-content: center;
		gap: 10px;
	}

	label:has(input) {
		display: flex;
		justify-content: right;
		align-items: center;
		gap: 10px;
	}
</style>
