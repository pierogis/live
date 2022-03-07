<script lang="ts">
	export let message: string;
	export let good: boolean;
</script>

<div class="alert border shadow" class:good>{message}</div>

<style>
	@keyframes fadeout {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}
	.alert {
		position: absolute;
		top: 30%;

		z-index: 15;

		padding: 0.2rem 0.4rem;

		background-color: var(--accent-color);
		color: var(--primary-color);

		animation: fadeout 2s;
		animation-delay: 2s;
		animation-fill-mode: forwards;
	}
	.good {
		background-color: var(--secondary-color);
		color: var(--primary-color);
	}
</style>
