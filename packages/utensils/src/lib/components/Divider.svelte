<script lang="ts">
	interface Props {
		horizontal?: boolean;
		size?: string;
		margin?: string;
		backgroundColor?: string;
	}

	let {
		horizontal = false,
		size = '4px',
		margin = '1rem',
		backgroundColor = 'var(--accent-color)'
	}: Props = $props();
</script>

<div
	class="divider"
	class:horizontal
	style:--size={size}
	style:--margin={margin}
	style:--background-color={backgroundColor}
></div>

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
