<script lang="ts">
	export let inset = true;
	export let shadow = false;

	export let width: string;
	export let height: string;

	export let urls: string[];
	export let alt: string;
</script>

<img
	class:inset
	class:shadow
	style:--width={width}
	style:--height={height}
	src={urls[0] || ''}
	{alt}
/>

<style>
	img {
		object-fit: contain;

		border: solid 3px var(--text-color);
		border-radius: 10px;

		max-width: var(--width);
		max-height: var(--height);

		width: 100%;
		height: 100%;
	}
</style>
