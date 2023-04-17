<script lang="ts">
	export let horizontal = false;
	export let size: string;
	export let margin = '1rem';
</script>

<div class="divider" class:horizontal style:--size={size} style:--margin={margin} />

<style>
	.divider {
		width: var(--size);
		border-radius: 4px;
		margin: var(--margin);

		background-color: var(--accent-color);
	}

	.divider.horizontal {
		height: var(--size);
		width: 90%;
	}
</style>
