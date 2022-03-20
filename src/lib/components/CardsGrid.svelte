<div class="grid">
	<slot />
</div>

<style>
	.grid {
		display: flex;

		justify-content: center;
		flex-wrap: wrap;
	}
	:global(.grid > *) {
		margin: 1rem 2rem 1rem 2rem;
	}
</style>
