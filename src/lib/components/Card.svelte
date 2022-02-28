<div class="card">
	<slot />
</div>

<style>
	.card {
		max-height: 90vw;
		max-width: 90vw;
		padding: 8px;

		display: flex;
		flex-direction: column;
		justify-content: center;
		align-content: center;

		text-align: center;

		background-color: var(--primary-color);

		box-shadow: inset 0px 0px 4px 2px rgba(165, 165, 165, 0.393),
			0px 0px 4px 2px rgba(165, 165, 165, 0.393);

		border-top: outset 5px var(--secondary-color);
		border-left: outset 5px var(--secondary-color);
		border-bottom: inset 5px var(--accent-color);
		border-right: inset 5px var(--accent-color);
		border-radius: 5%;
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
