<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler, KeyboardEventHandler } from 'svelte/elements';

	interface Props {
		clickable?: boolean;
		hoverable?: boolean;
		children?: Snippet;
		onclick?: MouseEventHandler<HTMLDivElement>;
		onkeypress?: KeyboardEventHandler<HTMLDivElement>;
	}

	let { clickable = true, hoverable = true, children, onclick, onkeypress }: Props = $props();
</script>

<div
	class="no-select"
	role="button"
	tabindex="0"
	class:clickable
	class:hoverable
	{onclick}
	{onkeypress}
>
	{@render children?.()}
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
