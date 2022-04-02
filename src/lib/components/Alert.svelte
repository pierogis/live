<script lang="ts">
	export let message: string;
	export let good: boolean;
	export let bad: boolean;
</script>

<div class="alert border inset shadow no-select" class:good class:bad>{message}</div>

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
		top: 10%;

		z-index: 15;

		padding: 0.2rem 0.4rem;

		animation: fadeout 2s;
		animation-delay: 2s;
		animation-fill-mode: forwards;
	}
</style>
