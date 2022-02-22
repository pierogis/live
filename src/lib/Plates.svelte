<script lang="ts">
	export let grid: boolean;
</script>

<div class="plates" class:grid>
	<slot />
</div>

<style>
	.plates {
		margin: 20px;

		display: flex;
		justify-content: center;
	}
	.grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 40px;

		justify-items: center;
	}
	@media only screen and (min-width: 400px) {
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
