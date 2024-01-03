<script lang="ts">
	export let horizontal = false;
	export let size: string = '4px';
	export let margin = '1rem';
	export let backgroundColor = 'var(--accent-color)';
</script>

<div
	class="divider"
	class:horizontal
	style:--size={size}
	style:--margin={margin}
	style:--background-color={backgroundColor}
/>

<style>
	.divider {
		width: var(--size);
		border-radius: 4px;
		margin: var(--margin);

		background-color: var(--background-color);
	}

	.divider.horizontal {
		height: var(--size);
		width: 100%;
	}
</style>
