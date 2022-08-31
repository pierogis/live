<script lang="ts">
	export let horizontal = false;
	export let size: string;
</script>

<div class="divider" class:horizontal style:--size={size} />

<style>
	.divider {
		width: var(--size);
		border-radius: 4px;

		background-color: var(--accent-color);
	}

	@media only screen and (max-width: 40rem) {
		.divider {
			height: var(--size);
			width: 100%;
		}
	}

	.divider.horizontal {
		height: var(--size);
		width: 90vw;
		margin: 1rem;
	}
</style>
