<script lang="ts">
	import { ImageDisplay } from '$lib';

	let width = '200px';
	let height = '100px';
</script>

<span>an <code>ImageDisplay</code></span>
<ImageDisplay
	{width}
	{height}
	urls={[
		'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Emoji_u1f44b.svg/2048px-Emoji_u1f44b.svg.png'
	]}
	alt="hello!"
/>
<span>can definitely display an image wrapped in a border</span>

<div>
	<label for="width">width</label>
	<br />
	<input id="width" class="inset" type="range" bind:value={width} />
</div>
<div>
	<label for="height">height</label>
	<br />
	<input id="height" class="inset" type="range" bind:value={height} />
</div>
