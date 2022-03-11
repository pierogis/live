<script lang="ts">
	export let mediumColumns: number = 2;
	export let largeColumns: number = 3;
	export let maximumColumns: number = 4;
</script>

<div
	class="grid"
	style:--medium-columns={mediumColumns}
	style:--large-columns={largeColumns}
	style:--maximum-columns={maximumColumns}
>
	<slot />
</div>

<style>
	.grid {
		display: grid;
		gap: 1rem;

		justify-items: center;
	}

	@media only screen and (min-width: 448px) {
		.grid {
			gap: 1rem;
			grid-template-columns: repeat(var(--medium-columns), 1fr);
		}
	}
	@media only screen and (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(var(--large-columns), 1fr);
			gap: 2rem;
		}
	}
	@media only screen and (min-width: 960px) {
		.grid {
			grid-template-columns: repeat(var(--maximum-columns), 1fr);
			gap: 2rem;
		}
	}
</style>
