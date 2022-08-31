<script lang="ts">
	export let width: string;
	export let height: string;

	export let urls: string[];
	export let alt: string;
</script>

<img
	class="inset shadow"
	style:--width={width}
	style:--height={height}
	src={urls[0] || ''}
	{width}
	{height}
	{alt}
/>

<style>
	img {
		object-fit: contain;

		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;

		width: var(--width);
		height: var(--height);
	}
</style>
