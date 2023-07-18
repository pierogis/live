<script lang="ts">
	export let inset = true;
	export let shadow = false;

	export let width: string;
	export let height: string;

	export let urls: string[];
	export let alt: string;

	export let style = '';
</script>

<div class:inset class:shadow>
	<img {style} style:--width={width} style:--height={height} src={urls[0] || ''} {alt} />
</div>

<style>
	div {
		display: flex;

		border: solid 3px var(--text-color);
		border-radius: 10px;
	}
	img {
		object-fit: contain;

		max-width: var(--width);
		max-height: var(--height);

		width: 100%;
		height: 100%;

		transition: all 200ms;
	}
</style>
