<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		columnGap?: string;
		rowGap?: string;
		column?: boolean;
		title?: Snippet;
		children?: Snippet;
	}

	let { columnGap = '2rem', rowGap = '1rem', column = false, title, children }: Props = $props();
</script>

<section class:column style:--row-gap={rowGap} style:--column-gap={columnGap}>
	{@render title?.()}
	{@render children?.()}
</section>

<style>
	section {
		display: flex;
		flex-flow: wrap;

		justify-content: center;
		align-items: center;
		column-gap: var(--column-gap);
		row-gap: var(--row-gap);
	}

	section.column {
		flex-direction: column;
	}

	@media only screen and (min-width: 70rem) {
		section {
			flex-direction: row;
		}
	}
</style>
