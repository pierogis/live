<div class="grid">
	<slot />
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		margin: 1rem;

		justify-items: center;
	}
	@media only screen and (min-width: 448px) {
		.grid {
			gap: 1rem;
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media only screen and (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
			gap: 2rem;
		}
	}
</style>
