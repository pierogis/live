<div class="card border">
	<slot />
</div>

<style>
	.card {
		max-height: 90vw;
		max-width: 90vw;
		padding: 8px;

		display: flex;
		flex-direction: column;
		align-items: center;
		position: relative;

		background-color: var(--primary-color);
	}

	:global(.card > *) {
		margin: 8px;
	}
	/* @media only screen and (min-width: 400px) {
		.card {
		max-height: 200px;
		max-width: 200px;
		}
	} */
	@media only screen and (min-width: 700px) {
		.card {
			max-height: 384px;
			max-width: 384px;
		}
	}
</style>
