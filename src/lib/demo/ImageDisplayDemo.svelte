<script lang="ts">
	import { ImageDisplay } from '$lib';

	let width = 200;
	let height = 100;
	let widthUnit = 'px';
	let heightUnit = 'px';
</script>

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

<div>
	<label>
		width
		<input class="inset" type="number" bind:value={width} />
	</label>
	<br />

	<label>
		<input type="radio" bind:group={widthUnit} name="widthUnit" value={'rem'} />
		rem
	</label>

	<label>
		<input type="radio" bind:group={widthUnit} name="widthUnit" value={'px'} />
		px
	</label>
</div>
<div>
	<label>
		height

		<input class="inset" type="number" bind:value={height} />
	</label>
	<br />

	<label>
		<input type="radio" bind:group={heightUnit} name="heightUnit" value={'rem'} />
		rem
	</label>

	<label>
		<input type="radio" bind:group={heightUnit} name="heightUnit" value={'px'} />
		px
	</label>
</div>

<style>
	input[type='number'] {
		width: 4rem;
	}
</style>
