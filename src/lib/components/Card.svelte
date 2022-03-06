<div class="card border shadow">
	<slot />
</div>

<style>
	.card {
		max-height: 80vw;
		max-width: 80vw;
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
	@media only screen and (min-width: 640) {
		.card {
			max-height: 512px;
			max-width: 512px;
		}
	}
</style>
