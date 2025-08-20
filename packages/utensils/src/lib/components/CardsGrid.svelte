<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
	}

	let { children }: Props = $props();
</script>

<div class="grid">
	{@render children?.()}
</div>

<style>
	.grid {
		display: flex;

		justify-content: center;
		align-items: center;
		flex-wrap: wrap;

		column-gap: 4rem;
		row-gap: 2rem;
	}
</style>
