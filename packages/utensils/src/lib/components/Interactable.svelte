<script lang="ts">
	export let clickable = true;
	export let hoverable = true;
</script>

<div class="no-select" class:clickable class:hoverable on:click on:keypress>
	<slot />
</div>

<style>
	div {
		position: relative;
		display: flex;
		z-index: 0;
	}

	.hoverable::before {
		content: '';
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: -1;

		border-radius: 10px;
		opacity: 0;

		box-shadow: var(--shadow);
		transform: scale(0.95);

		transition: all 200ms;
	}

	.hoverable:hover::before {
		opacity: 1;
		transform: scale(1);
	}
</style>
