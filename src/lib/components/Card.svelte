<div class="card border inset shadow">
	<slot />
</div>

<style>
	.card {
		max-width: 50vw;
		max-height: 60rem;
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
	@media only screen and (max-width: 448px) {
		.card {
			max-width: 80vw;
		}
	}
</style>
