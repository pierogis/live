<div class="grid">
	<slot />
</div>

<style>
	.grid {
		display: flex;

		justify-content: center;
		align-items: center;
		flex-wrap: wrap;

		column-gap: 4rem;
		row-gap: 2rem;
	}
</style>
