<div class="grid">
	<slot />
</div>

<style>
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 64px;
		margin: 32px;

		justify-items: center;
	}
	@media only screen and (min-width: 500px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media only screen and (min-width: 700px) {
		.grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
