<script lang="ts">
	export let clickable = true;
	export let hoverable = true;
</script>

<div class:clickable class:hoverable>
	<slot />
</div>

<style>
	div {
		position: relative;
		display: flex;
		z-index: 0;
	}

	.clickable {
		cursor: pointer;
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

	.clickable:active {
		transform: translate(0, 1px);
	}
</style>
