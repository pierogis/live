<script lang="ts">
	export let small: boolean;

	export let urls: string[];
	export let alt: string;
</script>

<div class="image-container">
	<img class="image inset shadow" class:small src={urls[0] || ''} {alt} />
</div>

<style>
	.image {
		object-fit: contain;

		border-top: solid 0.2rem var(--text-color);
		border-left: solid 0.2rem var(--text-color);
		border-bottom: solid 0.2rem var(--text-color);
		border-right: solid 0.2rem var(--text-color);
		border-radius: 0.6rem;

		max-width: 400px;
		max-height: 200px;
	}

	.image.small {
		max-width: 200px;
		max-height: 100px;
	}

	.image-container {
		display: flex;
		justify-content: center;
	}
</style>
