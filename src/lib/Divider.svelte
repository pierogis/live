<script lang="ts">
	export let horizontal = false;
</script>

<div class="divider" class:horizontal />

<style>
	.divider {
		width: var(--divider-size);
		border-radius: 4px;

		background-color: var(--accent-color);
	}

	@media only screen and (max-width: 40rem) {
		.divider {
			height: var(--divider-size);
			width: 100%;
		}
	}

	.divider.horizontal {
		height: var(--divider-size);
		width: 90vw;
		margin: 1rem;
	}
</style>
