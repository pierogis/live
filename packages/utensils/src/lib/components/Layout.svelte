<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title?: Snippet;
		nav?: Snippet;
		children?: Snippet;
		footer?: Snippet;
	}

	let { title, nav, children, footer }: Props = $props();
</script>

<header>
	<a href="/">
		{@render title?.()}
	</a>
</header>

{@render nav?.()}

<div class="content">{@render children?.()}</div>

{@render footer?.()}

<style>
	.content {
		display: flex;
		flex-direction: column;
		align-items: center;
		align-content: center;
		justify-content: center;
		flex-wrap: wrap;

		padding: 1em;
		gap: 1em;
	}
</style>
