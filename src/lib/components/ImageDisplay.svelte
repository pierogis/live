<script lang="ts">
	export let width: string;
	export let height: string;

	export let urls: string[];
	export let alt: string;
</script>

<img class="inset shadow" style:--width={width} style:--height={height} src={urls[0] || ''} {alt} />

<style>
	img {
		object-fit: contain;

		border: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;

		max-width: var(--width);
		max-height: var(--height);

		width: 100%;
		height: 100%;
	}
</style>
