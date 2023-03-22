<div class="card border inset shadow">
	<slot />
</div>

<style>
	.card {
		padding: 0.4rem;
		max-width: 80vw;

		display: flex;
		flex-direction: column;
		place-items: center;
		place-content: center;

		position: relative;

		background-color: var(--primary-color);
	}

	:global(.card > *) {
		margin: 0.4rem;

		max-width: 90%;
		max-height: 90%;
	}
</style>
