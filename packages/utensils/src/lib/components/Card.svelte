<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		border?: boolean;
		inset?: boolean;
		shadow?: boolean;
		children?: Snippet;
	}

	let { border = true, inset = true, shadow = false, children }: Props = $props();
</script>

<div class="card" class:border class:inset class:shadow>
	{@render children?.()}
</div>

<style>
	.card {
		padding: 12px;
		height: 100%;

		display: flex;
		flex-direction: column;
		place-items: center;
		place-content: center;
		gap: 12px;

		position: relative;

		background-color: var(--primary-color);

		text-align: center;
	}
</style>
