<script lang="ts">
	export let title: string | null = null;
	export let columnGap = '2rem';
	export let rowGap = '1rem';
	export let column = false;
</script>

<section class:column style:--row-gap={rowGap} style:--column-gap={columnGap}>
	{#if title}
		<h3 class="section-title">{title}</h3>
	{/if}
	<slot />
</section>

<style>
	section {
		width: 90%;

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

	.section-title {
		text-decoration: underline;
	}
</style>
