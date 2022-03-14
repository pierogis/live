<div class="card border inset shadow">
	<slot />
</div>

<style>
	.card {
		padding: 0.4rem;

		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;

		background-color: var(--primary-color);
	}

	:global(.card > *) {
		margin: 0.4rem;
	}
	@media only screen and (max-width: 448px) {
		.card {
			max-width: 80vw;
		}
	}
</style>
